package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"flashcard-backend/internal/config"
	"flashcard-backend/internal/infrastructure/auth"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Printf("🔐 AUTH MIDDLEWARE - URL: %s %s\n", c.Request.Method, c.Request.URL.Path)

		// Verificar se é uma requisição OPTIONS (CORS preflight)
		if c.Request.Method == "OPTIONS" {
			fmt.Printf("🔐 AUTH MIDDLEWARE - CORS preflight, skipping auth\n")
			c.Next()
			return
		}

		var tokenString string

		// 1. Tentar header Authorization padrão
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			fmt.Printf("🔐 AUTH MIDDLEWARE - Token from Authorization header\n")
		}

		// 2. Tentar header customizado para React Native
		if tokenString == "" {
			customAuth := c.GetHeader("X-Auth-Token")
			fmt.Printf("🔐 AUTH MIDDLEWARE - X-Auth-Token header: '%s'\n", customAuth)
			if customAuth != "" {
				tokenString = customAuth
				fmt.Printf("🔐 AUTH MIDDLEWARE - Token from X-Auth-Token header\n")
			}
		}

		fmt.Printf("🔐 AUTH MIDDLEWARE - Final token string: '%s'\n", tokenString)

		if tokenString == "" {
			fmt.Printf("🔐 AUTH MIDDLEWARE - No token found\n")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		fmt.Printf("🔐 AUTH MIDDLEWARE - Validating token...\n")
		claims, err := auth.ValidateToken(tokenString, cfg.Auth.JWTSecret)
		if err != nil {
			fmt.Printf("🔐 AUTH MIDDLEWARE - Token validation failed: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		fmt.Printf("🔐 AUTH MIDDLEWARE - Token validated successfully\n")
		fmt.Printf("🔐 AUTH MIDDLEWARE - User ID: %s (type: %T)\n", claims.UserID, claims.UserID)
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Next()
	}
}
