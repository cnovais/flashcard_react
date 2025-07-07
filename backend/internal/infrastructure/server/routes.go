package server

import (
	"flashcard-backend/internal/config"
	"flashcard-backend/internal/infrastructure/server/middleware"
	"flashcard-backend/internal/modules/admin"
	"flashcard-backend/internal/modules/auth"
	"flashcard-backend/internal/modules/favorites"
	"flashcard-backend/internal/modules/flashcards"
	"flashcard-backend/internal/modules/gamification"
	"flashcard-backend/internal/modules/plans"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	router *gin.Engine,
	authModule *auth.Module,
	flashcardsModule *flashcards.Module,
	plansModule *plans.Module,
	gamificationModule *gamification.Module,
	favoriteModule *favorites.Module,
	adminModule *admin.Module,
	cfg *config.Config,
) {
	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Auth routes (public)
	auth := router.Group("/auth")
	{
		auth.GET("/urls", authModule.Handler.GetAuthURLs)
		auth.GET("/google", authModule.Handler.GoogleAuth)
		auth.GET("/linkedin", authModule.Handler.LinkedInAuth)
		auth.POST("/register", authModule.Handler.Register)
		auth.POST("/login", authModule.Handler.Login)
		auth.POST("/forgot-password", authModule.Handler.ForgotPassword)
		auth.POST("/validate-reset-code", authModule.Handler.ValidateResetCode)
		auth.POST("/reset-password", authModule.Handler.ResetPassword)
		auth.POST("/google", authModule.Handler.GoogleAuthExpo)
	}

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(cfg))
	{
		// User routes
		user := protected.Group("/user")
		{
			user.PUT("/avatar", authModule.Handler.UpdateAvatar)
			user.PUT("/profile", authModule.Handler.UpdateProfile)
		}

		// Deck routes
		decks := protected.Group("/decks")
		{
			decks.GET("", flashcardsModule.Handler.GetDecks)
			decks.POST("", flashcardsModule.Handler.CreateDeck)

			// Rotas de favoritos - agora com prefixo fixo para evitar conflitos
			decks.POST("/favorite/:deckId", favoriteModule.Handler.AddFavorite)
			decks.DELETE("/favorite/:deckId", favoriteModule.Handler.RemoveFavorite)
			decks.GET("/favorites", favoriteModule.Handler.ListFavorites)

			// Rotas genéricas de deck
			decks.GET(":id", flashcardsModule.Handler.GetDeck)
			decks.PUT(":id", flashcardsModule.Handler.UpdateDeck)
			decks.DELETE(":id", flashcardsModule.Handler.DeleteDeck)
		}

		// Flashcard routes
		cards := protected.Group("/cards")
		{
			cards.GET("/deck/:deckId", flashcardsModule.Handler.GetFlashcards)
			cards.POST("", flashcardsModule.Handler.CreateFlashcard)
			cards.PUT("/:id", flashcardsModule.Handler.UpdateFlashcard)
			cards.DELETE("/:id", flashcardsModule.Handler.DeleteFlashcard)
		}

		// Study session routes
		study := protected.Group("/study")
		{
			study.POST("/start", flashcardsModule.Handler.StartStudySession)
			study.PUT("/:id/end", flashcardsModule.Handler.EndStudySession)
			study.POST("/review", flashcardsModule.Handler.ReviewCard)
			study.GET("/history", flashcardsModule.Handler.GetStudyHistory)
		}

		// Plan routes
		plans := protected.Group("/plans")
		{
			plans.GET("/", plansModule.Handler.GetAllPlans)
			plans.GET("/user", plansModule.Handler.GetUserPlan)
			plans.POST("/upgrade", plansModule.Handler.UpgradePlan)
			plans.POST("/downgrade", plansModule.Handler.DowngradeToFree)
			plans.GET("/limits", plansModule.Handler.GetUserLimits)
		}

		// Stats routes
		stats := protected.Group("/stats")
		{
			stats.GET("/summary", gamificationModule.StatsHandler.GetStudyStatsSummary)
			stats.GET("/period", gamificationModule.StatsHandler.GetStudyStatsByPeriod)
			stats.GET("/difficulty", gamificationModule.StatsHandler.GetPerformanceByDifficulty)
			stats.GET("/decks", gamificationModule.StatsHandler.GetDeckPerformance)
			stats.GET("/time-distribution", gamificationModule.StatsHandler.GetTimeDistribution)
			stats.GET("/detailed", gamificationModule.StatsHandler.GetDetailedStats)
			stats.GET("/export", gamificationModule.StatsHandler.ExportStats)
		}

		// Gamification routes
		gamification := protected.Group("/gamification")
		{
			gamification.GET("/stats", gamificationModule.StatsHandler.GetGamificationStats)
			gamification.GET("/achievements", gamificationModule.Handler.GetUserAchievements)
			gamification.GET("/achievements/unlocked", gamificationModule.Handler.GetUnlockedAchievements)
			gamification.GET("/achievements/category/:category", gamificationModule.Handler.GetAchievementsByCategory)
			gamification.POST("/achievements/check", gamificationModule.Handler.CheckAchievements)
			gamification.POST("/achievements/initialize", gamificationModule.Handler.InitializeAchievements)
		}

		// Admin routes
		admin := protected.Group("/admin")
		{
			admin.GET("/config", adminModule.Handler.GetConfig)
			admin.PUT("/config", adminModule.Handler.UpdateConfig)
			admin.GET("/limits", adminModule.Handler.GetLimits)
			admin.GET("/users", adminModule.Handler.GetAllAdminUsers)
			admin.POST("/users", adminModule.Handler.CreateAdminUser)
			admin.PUT("/users/:id", adminModule.Handler.UpdateAdminUser)
			admin.DELETE("/users/:id", adminModule.Handler.DeleteAdminUser)
		}
	}
}
