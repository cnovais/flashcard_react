package flashcards

import (
	"context"
	"flashcard-backend/internal/config"
	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/infrastructure/database"
	"flashcard-backend/internal/modules/gamification"
)

type Module struct {
	Handler      *Handler
	Service      *Service
	Repo         *MongoRepository
	StatsService *gamification.StatsService
}

func NewModule(db *database.MongoDB, cfg *config.Config, adminService interface {
	ValidateDeckLimit(ctx context.Context, userPlan string, currentDeckCount int, isPublic bool) error
	ValidateCardLimit(ctx context.Context, userPlan string, currentCardCount int) error
	ValidatePublicDeckLimit(ctx context.Context, userPlan string, currentPublicDeckCount int) error
	ValidatePublicCardLimit(ctx context.Context, userPlan string, currentPublicCardCount int) error
}, authService interface {
	GetUserByID(userID string) (*entities.User, error)
}) *Module {
	repo := NewMongoRepository(db)
	service := NewService(repo, cfg, adminService, authService)
	statsService := gamification.NewStatsService(db)
	handler := NewHandler(service, statsService, cfg)

	return &Module{
		Handler:      handler,
		Service:      service,
		Repo:         repo,
		StatsService: statsService,
	}
}
