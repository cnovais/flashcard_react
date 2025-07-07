package auth

import (
	"net/http"

	"flashcard-backend/internal/config"
	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/infrastructure/auth"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	service *Service
	cfg     *config.Config
}

func NewHandler(service *Service, cfg *config.Config) *Handler {
	return &Handler{
		service: service,
		cfg:     cfg,
	}
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User  *entities.User `json:"user"`
	Token string         `json:"token"`
}

type UpdateProfileRequest struct {
	Name string `json:"name" binding:"required"`
}

func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}

	// Check if user already exists
	existingUser, err := h.service.repo.GetUserByEmail(req.Email)
	if err == nil && existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists with this email"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := &entities.User{
		Email:    req.Email,
		Name:     req.Name,
		Password: string(hashedPassword),
		Provider: "email",
		Plan:     "free",
		XP:       0,
		Streak:   0,
	}

	if err := h.service.repo.CreateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Enviar e-mail de boas-vindas (assíncrono)
	go sendWelcomeEmail(user.Email, user.Name)

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Email, h.cfg.Auth.JWTSecret, h.cfg.Auth.JWTExpiry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Clear password from response
	user.Password = ""

	c.JSON(http.StatusCreated, AuthResponse{
		User:  user,
		Token: token,
	})
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}

	// Get user by email
	user, err := h.service.repo.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Email, h.cfg.Auth.JWTSecret, h.cfg.Auth.JWTExpiry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Update last login
	if err := h.service.repo.UpdateUserLastLogin(user.ID); err != nil {
		// Log error but don't fail the request
		c.Error(err)
	}

	// Clear password from response
	user.Password = ""

	c.JSON(http.StatusOK, AuthResponse{
		User:  user,
		Token: token,
	})
}

func (h *Handler) GoogleAuth(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code is required"})
		return
	}

	user, token, err := h.service.AuthenticateWithGoogle(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Authentication failed: " + err.Error()})
		return
	}

	// Clear password from response
	user.Password = ""

	c.JSON(http.StatusOK, AuthResponse{
		User:  user,
		Token: token,
	})
}

func (h *Handler) LinkedInAuth(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code is required"})
		return
	}

	user, token, err := h.service.AuthenticateWithLinkedIn(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Authentication failed: " + err.Error()})
		return
	}

	// Clear password from response
	user.Password = ""

	c.JSON(http.StatusOK, AuthResponse{
		User:  user,
		Token: token,
	})
}

func (h *Handler) GetAuthURLs(c *gin.Context) {
	googleURL := "https://accounts.google.com/o/oauth2/auth?" +
		"client_id=" + h.cfg.OAuth.GoogleClientID +
		"&redirect_uri=" + h.cfg.OAuth.RedirectURL +
		"&scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile" +
		"&response_type=code"

	linkedinURL := "https://www.linkedin.com/oauth/v2/authorization?" +
		"client_id=" + h.cfg.OAuth.LinkedInClientID +
		"&redirect_uri=" + h.cfg.OAuth.RedirectURL +
		"&scope=r_liteprofile r_emailaddress" +
		"&response_type=code"

	c.JSON(http.StatusOK, gin.H{
		"google":   googleURL,
		"linkedin": linkedinURL,
	})
}

func (h *Handler) UpdateAvatar(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		Avatar string `json:"avatar" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	if err := h.service.UpdateAvatar(userID, req.Avatar); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update avatar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Avatar updated successfully"})
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}

	err := h.service.UpdateUserProfile(userID, req.Name, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

func (h *Handler) ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email inválido"})
		return
	}
	_, err := h.service.CreatePasswordResetCode(req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Código enviado para o email (simulado)"})
}

func (h *Handler) ValidateResetCode(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
		Code  string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}
	err := h.service.ValidatePasswordResetCode(req.Email, req.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Código válido"})
}

func (h *Handler) ResetPassword(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Code     string `json:"code" binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}
	err := h.service.ResetPassword(req.Email, req.Code, req.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Senha redefinida com sucesso"})
}

func (h *Handler) GoogleAuthExpo(c *gin.Context) {
	var req struct {
		AccessToken string `json:"access_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "access_token obrigatório"})
		return
	}
	user, token, err := h.service.AuthenticateWithGoogleAccessToken(req.AccessToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	user.Password = ""
	c.JSON(http.StatusOK, AuthResponse{
		User:  user,
		Token: token,
	})
}
