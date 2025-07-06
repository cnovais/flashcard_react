package config

import (
	"os"
	"strconv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Auth     AuthConfig
	OAuth    OAuthConfig
	AWS      AWSConfig
	Stripe   StripeConfig
}

type ServerConfig struct {
	Port string
	Host string
}

type DatabaseConfig struct {
	URI  string
	Name string
}

type AuthConfig struct {
	JWTSecret string
	JWTExpiry int // in hours
}

type OAuthConfig struct {
	GoogleClientID     string
	GoogleClientSecret string
	LinkedInClientID   string
	LinkedInClientSecret string
	RedirectURL        string
}

type AWSConfig struct {
	Region          string
	AccessKeyID     string
	SecretAccessKey string
	S3Bucket        string
}

type StripeConfig struct {
	SecretKey     string
	PublishableKey string
	WebhookSecret string
}

func New() *Config {
	return &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "9090"),
			Host: getEnv("HOST", "localhost"),
		},
		Database: DatabaseConfig{
			URI:  getEnv("MONGODB_URI", "mongodb://localhost:27017"),
			Name: getEnv("MONGODB_NAME", "flashcard_db"),
		},
		Auth: AuthConfig{
			JWTSecret: getEnv("JWT_SECRET", "your-secret-key"),
			JWTExpiry: getEnvAsInt("JWT_EXPIRY", 24),
		},
		OAuth: OAuthConfig{
			GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
			GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
			LinkedInClientID:   getEnv("LINKEDIN_CLIENT_ID", ""),
			LinkedInClientSecret: getEnv("LINKEDIN_CLIENT_SECRET", ""),
			RedirectURL:        getEnv("OAUTH_REDIRECT_URL", "http://localhost:8080/auth/callback"),
		},
		AWS: AWSConfig{
			Region:          getEnv("AWS_REGION", "us-east-1"),
			AccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
			SecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
			S3Bucket:        getEnv("AWS_S3_BUCKET", ""),
		},
		Stripe: StripeConfig{
			SecretKey:      getEnv("STRIPE_SECRET_KEY", ""),
			PublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY", ""),
			WebhookSecret:  getEnv("STRIPE_WEBHOOK_SECRET", ""),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
} 