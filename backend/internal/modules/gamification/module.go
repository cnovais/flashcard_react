package gamification

import (
	"flashcard-backend/internal/config"
	"flashcard-backend/internal/infrastructure/database"
)

type Module struct {
	Handler            *AchievementHandler
	AchievementService *AchievementService
	AchievementRepo    *AchievementRepository
	StatsService       *StatsService
	StatsRepo          *StatsRepository
	StatsHandler       *StatsHandler
}

func NewModule(db *database.MongoDB, cfg *config.Config) *Module {
	achievementRepo := NewAchievementRepository(db)
	statsRepo := NewStatsRepository(db)

	achievementService := NewAchievementService(achievementRepo, statsRepo)
	statsService := NewStatsService(db)

	achievementHandler := NewAchievementHandler(achievementService)
	statsHandler := NewStatsHandler(db)

	return &Module{
		Handler:            achievementHandler,
		AchievementService: achievementService,
		AchievementRepo:    achievementRepo,
		StatsService:       statsService,
		StatsRepo:          statsRepo,
		StatsHandler:       statsHandler,
	}
}
