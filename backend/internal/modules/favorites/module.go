package favorites

import (
	"flashcard-backend/internal/infrastructure/database"
)

type Module struct {
	Handler *Handler
	Service *FavoriteService
	Repo    *FavoriteRepository
}

func NewModule(db *database.MongoDB) *Module {
	repo := NewFavoriteRepository(db.Database)
	service := NewFavoriteService(repo)
	handler := NewHandler(service)
	return &Module{
		Handler: handler,
		Service: service,
		Repo:    repo,
	}
}
