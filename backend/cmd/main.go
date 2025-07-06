package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"flashcard-backend/internal/config"
	"flashcard-backend/internal/infrastructure/database"
	"flashcard-backend/internal/infrastructure/server"
	"flashcard-backend/internal/infrastructure/server/middleware"
	"flashcard-backend/internal/modules/admin"
	"flashcard-backend/internal/modules/auth"
	"flashcard-backend/internal/modules/favorites"
	"flashcard-backend/internal/modules/flashcards"
	"flashcard-backend/internal/modules/gamification"
	plansModule "flashcard-backend/internal/modules/plans"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize configuration
	cfg := config.New()

	// Initialize database
	db, err := database.NewMongoDB(cfg.Database.URI, cfg.Database.Name)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize Gin router
	router := gin.Default()

	// Add middleware
	router.Use(middleware.CORS())
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())

	// Initialize modules
	authModule := auth.NewModule(db, cfg)
	adminModule := admin.NewModule(db.Database)
	flashcardsModule := flashcards.NewModule(db, cfg, adminModule.Service, authModule.Service)
	plansModuleInstance := plansModule.NewModule(db, cfg)
	gamificationModule := gamification.NewModule(db, cfg)
	favoriteModule := favorites.NewModule(db)

	// Setup routes
	server.SetupRoutes(router, authModule, flashcardsModule, plansModuleInstance, gamificationModule, favoriteModule, adminModule, cfg)

	// Create HTTP server
	srv := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Give outstanding requests a deadline for completion
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}
