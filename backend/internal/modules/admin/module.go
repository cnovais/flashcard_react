package admin

import (
	"go.mongodb.org/mongo-driver/mongo"
)

type Module struct {
	Repo    *AdminRepository
	Service *Service
	Handler *Handler
}

func NewModule(db *mongo.Database) *Module {
	repo := NewAdminRepository(db)
	service := NewService(repo)
	handler := NewHandler(service)

	return &Module{
		Repo:    repo,
		Service: service,
		Handler: handler,
	}
}
