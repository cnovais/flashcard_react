package auth

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"net/http"
	"net/smtp"
	"os"
	"strconv"
	"time"

	"flashcard-backend/internal/config"
	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/infrastructure/auth"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
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

func generateRandomCode(n int) (string, error) {
	const letters = "0123456789"
	b := make([]byte, n)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	for i := 0; i < n; i++ {
		b[i] = letters[int(b[i])%len(letters)]
	}
	return string(b), nil
}

func sendResetEmail(to, code string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")
	if host == "" || port == "" || user == "" || pass == "" || from == "" {
		return fmt.Errorf("Configuração SMTP ausente")
	}
	portInt, err := strconv.Atoi(port)
	if err != nil {
		return fmt.Errorf("Porta SMTP inválida")
	}
	addr := fmt.Sprintf("%s:%d", host, portInt)
	msg := []byte("To: " + to + "\r\n" +
		"Subject: Código de recuperação de senha\r\n" +
		"Content-Type: text/plain; charset=UTF-8\r\n" +
		"\r\n" +
		fmt.Sprintf("Seu código de recuperação é: %s\nO código expira em 15 minutos.", code) +
		"\r\n")
	auth := smtp.PlainAuth("", user, pass, host)
	return smtp.SendMail(addr, auth, from, []string{to}, msg)
}

func (s *Service) CreatePasswordResetCode(email string) (string, error) {
	user, err := s.repo.GetUserByEmail(email)
	if err != nil || user == nil {
		return "", fmt.Errorf("Usuário não encontrado")
	}
	code, err := generateRandomCode(6)
	if err != nil {
		return "", err
	}
	resetCode := &entities.PasswordResetCode{
		Email:     email,
		Code:      code,
		ExpiresAt: time.Now().Add(15 * time.Minute),
		Used:      false,
		CreatedAt: time.Now(),
	}
	err = s.repo.CreatePasswordResetCode(resetCode)
	if err != nil {
		return "", err
	}
	err = sendResetEmail(email, code)
	if err != nil {
		return "", fmt.Errorf("Erro ao enviar email: %v", err)
	}
	return code, nil
}

func (s *Service) ValidatePasswordResetCode(email, code string) error {
	prc, err := s.repo.GetPasswordResetCode(email, code)
	if err != nil {
		return fmt.Errorf("Código inválido ou expirado")
	}
	if prc.Used {
		return fmt.Errorf("Código já utilizado")
	}
	if prc.ExpiresAt.Before(time.Now()) {
		return fmt.Errorf("Código expirado")
	}
	return nil
}

func (s *Service) ResetPassword(email, code, newPassword string) error {
	prc, err := s.repo.GetPasswordResetCode(email, code)
	if err != nil {
		return fmt.Errorf("Código inválido ou expirado")
	}
	if prc.Used {
		return fmt.Errorf("Código já utilizado")
	}
	if prc.ExpiresAt.Before(time.Now()) {
		return fmt.Errorf("Código expirado")
	}
	user, err := s.repo.GetUserByEmail(email)
	if err != nil || user == nil {
		return fmt.Errorf("Usuário não encontrado")
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("Erro ao gerar hash da senha")
	}
	user.Password = string(hashedPassword)
	err = s.repo.UpdateUserPassword(user.Email, user.Password)
	if err != nil {
		return fmt.Errorf("Erro ao atualizar senha")
	}
	err = s.repo.MarkPasswordResetCodeUsed(prc.ID)
	if err != nil {
		return fmt.Errorf("Erro ao marcar código como usado")
	}
	return nil
}

func (s *Service) AuthenticateWithGoogleAccessToken(accessToken string) (*entities.User, string, error) {
	// Buscar dados do usuário na Google API
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken)
	if err != nil {
		return nil, "", fmt.Errorf("Erro ao buscar dados do Google: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, "", fmt.Errorf("Token do Google inválido (status %d)", resp.StatusCode)
	}
	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, "", fmt.Errorf("Erro ao decodificar resposta do Google: %v", err)
	}
	if !userInfo.VerifiedEmail {
		return nil, "", fmt.Errorf("Email do Google não verificado")
	}
	// Buscar ou criar usuário
	user, err := s.repo.GetUserByProviderID("google", userInfo.ID)
	if err != nil {
		// Criar novo usuário
		user = &entities.User{
			Email:      userInfo.Email,
			Name:       userInfo.Name,
			Avatar:     userInfo.Picture,
			Provider:   "google",
			ProviderID: userInfo.ID,
		}
		if err := s.repo.CreateUser(user); err != nil {
			return nil, "", fmt.Errorf("Erro ao criar usuário: %v", err)
		}
	} else {
		// Atualizar last login
		_ = s.repo.UpdateUserLastLogin(user.ID)
	}
	// Gerar JWT
	tokenString, err := auth.GenerateToken(user.ID, user.Email, s.cfg.Auth.JWTSecret, s.cfg.Auth.JWTExpiry)
	if err != nil {
		return nil, "", fmt.Errorf("Erro ao gerar token JWT: %v", err)
	}
	return user, tokenString, nil
}

// Função para enviar e-mail de boas-vindas
func sendWelcomeEmail(to, name string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")
	if host == "" || port == "" || user == "" || pass == "" || from == "" {
		return fmt.Errorf("Configuração SMTP ausente")
	}
	portInt, err := strconv.Atoi(port)
	if err != nil {
		return fmt.Errorf("Porta SMTP inválida")
	}
	addr := fmt.Sprintf("%s:%d", host, portInt)
	msg := []byte("To: " + to + "\r\n" +
		"Subject: Bem-vindo ao Flashcard!\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"\r\n" +
		fmt.Sprintf(`
		  <div style='font-family:sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:32px 24px 24px 24px;box-shadow:0 2px 8px #0001;'>
		    <h2 style='color:#FF6200;'>Bem-vindo, %s! 🎉</h2>
		    <p style='font-size:18px;color:#222;'>Sua conta foi criada com sucesso no <b>Flashcard</b>!</p>
		    <ul style='font-size:16px;color:#333;margin:18px 0 18px 18px;'>
		      <li>Crie e organize seus próprios decks de estudo</li>
		      <li>Adicione flashcards ilimitados</li>
		      <li>Ganhe XP e conquistas estudando diariamente</li>
		      <li>Acompanhe seu progresso com estatísticas detalhadas</li>
		      <li>Compartilhe decks com amigos</li>
		    </ul>
		    <p style='font-size:16px;color:#444;'>Acesse o app e comece a turbinar seus estudos agora mesmo!<br/><br/>Equipe Flashcard 🚀</p>
		    <hr style='margin:24px 0;border:none;border-top:1px solid #eee;'>
		    <p style='font-size:13px;color:#888;text-align:center;'>Dúvidas? Responda este e-mail ou acesse o menu de ajuda no app.</p>
		  </div>
		`, name) +
		"\r\n")
	auth := smtp.PlainAuth("", user, pass, host)
	return smtp.SendMail(addr, auth, from, []string{to}, msg)
}
