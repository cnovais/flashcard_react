package favorites

import (
	"context"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type FavoriteService struct {
	repo *FavoriteRepository
}

func NewFavoriteService(repo *FavoriteRepository) *FavoriteService {
	return &FavoriteService{repo: repo}
}

func (s *FavoriteService) AddFavorite(ctx context.Context, userID, deckID primitive.ObjectID) error {
	return s.repo.AddFavorite(ctx, userID, deckID)
}

func (s *FavoriteService) RemoveFavorite(ctx context.Context, userID, deckID primitive.ObjectID) error {
	return s.repo.RemoveFavorite(ctx, userID, deckID)
}

func (s *FavoriteService) IsFavorite(ctx context.Context, userID, deckID primitive.ObjectID) (bool, error) {
	return s.repo.IsFavorite(ctx, userID, deckID)
}

func (s *FavoriteService) ListFavoriteDeckIDs(ctx context.Context, userID primitive.ObjectID) ([]primitive.ObjectID, error) {
	return s.repo.ListFavoriteDeckIDs(ctx, userID)
}
