package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"flashcard-backend/internal/config"
	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/infrastructure/auth"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"golang.org/x/oauth2/linkedin"
	googleoauth2 "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

type Service struct {
	repo *Repository
	cfg  *config.Config
}

func NewService(repo *Repository, cfg *config.Config) *Service {
	return &Service{
		repo: repo,
		cfg:  cfg,
	}
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	VerifiedEmail bool   `json:"verified_email"`
}

type LinkedInUserInfo struct {
	ID        string `json:"id"`
	FirstName string `json:"localizedFirstName"`
	LastName  string `json:"localizedLastName"`
	Email     string `json:"email-address"`
	Picture   string `json:"profilePicture"`
}

func (s *Service) AuthenticateWithGoogle(code string) (*entities.User, string, error) {
	oauth2Config := &oauth2.Config{
		ClientID:     s.cfg.OAuth.GoogleClientID,
		ClientSecret: s.cfg.OAuth.GoogleClientSecret,
		RedirectURL:  s.cfg.OAuth.RedirectURL,
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}

	token, err := oauth2Config.Exchange(context.Background(), code)
	if err != nil {
		return nil, "", fmt.Errorf("failed to exchange token: %w", err)
	}

	// Get user info from Google
	service, err := googleoauth2.NewService(context.Background(), option.WithTokenSource(oauth2Config.TokenSource(context.Background(), token)))
	if err != nil {
		return nil, "", fmt.Errorf("failed to create oauth2 service: %w", err)
	}

	userInfo, err := service.Userinfo.Get().Do()
	if err != nil {
		return nil, "", fmt.Errorf("failed to get user info: %w", err)
	}

	// Check if user exists
	user, err := s.repo.GetUserByProviderID("google", userInfo.Id)
	if err != nil {
		// Create new user
		user = &entities.User{
			Email:      userInfo.Email,
			Name:       userInfo.Name,
			Avatar:     userInfo.Picture,
			Provider:   "google",
			ProviderID: userInfo.Id,
		}

		if err := s.repo.CreateUser(user); err != nil {
			return nil, "", fmt.Errorf("failed to create user: %w", err)
		}
	} else {
		// Update last login
		if err := s.repo.UpdateUserLastLogin(user.ID); err != nil {
			return nil, "", fmt.Errorf("failed to update last login: %w", err)
		}
	}

	// Generate JWT token
	tokenString, err := auth.GenerateToken(user.ID, user.Email, s.cfg.Auth.JWTSecret, s.cfg.Auth.JWTExpiry)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	return user, tokenString, nil
}

func (s *Service) AuthenticateWithLinkedIn(code string) (*entities.User, string, error) {
	oauth2Config := &oauth2.Config{
		ClientID:     s.cfg.OAuth.LinkedInClientID,
		ClientSecret: s.cfg.OAuth.LinkedInClientSecret,
		RedirectURL:  s.cfg.OAuth.RedirectURL,
		Scopes:       []string{"r_liteprofile", "r_emailaddress"},
		Endpoint:     linkedin.Endpoint,
	}

	token, err := oauth2Config.Exchange(context.Background(), code)
	if err != nil {
		return nil, "", fmt.Errorf("failed to exchange token: %w", err)
	}

	// Get user info from LinkedIn
	client := &http.Client{}
	req, err := http.NewRequest("GET", "https://api.linkedin.com/v2/me", nil)
	if err != nil {
		return nil, "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	resp, err := client.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	var userInfo LinkedInUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, "", fmt.Errorf("failed to decode user info: %w", err)
	}

	// Check if user exists
	user, err := s.repo.GetUserByProviderID("linkedin", userInfo.ID)
	if err != nil {
		// Create new user
		user = &entities.User{
			Email:      userInfo.Email,
			Name:       userInfo.FirstName + " " + userInfo.LastName,
			Avatar:     userInfo.Picture,
			Provider:   "linkedin",
			ProviderID: userInfo.ID,
		}

		if err := s.repo.CreateUser(user); err != nil {
			return nil, "", fmt.Errorf("failed to create user: %w", err)
		}
	} else {
		// Update last login
		if err := s.repo.UpdateUserLastLogin(user.ID); err != nil {
			return nil, "", fmt.Errorf("failed to update last login: %w", err)
		}
	}

	// Generate JWT token
	tokenString, err := auth.GenerateToken(user.ID, user.Email, s.cfg.Auth.JWTSecret, s.cfg.Auth.JWTExpiry)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	return user, tokenString, nil
}

func (s *Service) UpdateAvatar(userID string, avatar string) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	return s.repo.UpdateUserAvatar(objectID, avatar)
}

func (s *Service) GetUserByID(userID string) (*entities.User, error) {
	return s.repo.GetUserByID(userID)
}

func (s *Service) UpdateUserProfile(userID, name, email string) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}
	return s.repo.UpdateUserProfile(objectID, name, "")
}
