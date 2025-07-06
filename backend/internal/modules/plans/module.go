package plans

import (
	"flashcard-backend/internal/config"
	"flashcard-backend/internal/infrastructure/database"
)

type Module struct {
	Handler *Handler
	Service *Service
	Repo    *Repository
}

func NewModule(db *database.MongoDB, cfg *config.Config) *Module {
	repo := NewRepository(db)
	service := NewService(repo, cfg)
	handler := NewHandler(service, cfg)

	return &Module{
		Handler: handler,
		Service: service,
		Repo:    repo,
	}
}
