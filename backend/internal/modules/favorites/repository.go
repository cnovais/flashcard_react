package favorites

import (
	"context"
	"time"

	"flashcard-backend/internal/domain/entities"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type FavoriteRepository struct {
	collection *mongo.Collection
}

func NewFavoriteRepository(db *mongo.Database) *FavoriteRepository {
	return &FavoriteRepository{
		collection: db.Collection("favorites"),
	}
}

func (r *FavoriteRepository) AddFavorite(ctx context.Context, userID, deckID primitive.ObjectID) error {
	fav := entities.Favorite{
		UserID:    userID,
		DeckID:    deckID,
		CreatedAt: time.Now(),
	}
	_, err := r.collection.InsertOne(ctx, fav)
	return err
}

func (r *FavoriteRepository) RemoveFavorite(ctx context.Context, userID, deckID primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"user_id": userID, "deck_id": deckID})
	return err
}

func (r *FavoriteRepository) IsFavorite(ctx context.Context, userID, deckID primitive.ObjectID) (bool, error) {
	count, err := r.collection.CountDocuments(ctx, bson.M{"user_id": userID, "deck_id": deckID})
	return count > 0, err
}

func (r *FavoriteRepository) ListFavoriteDeckIDs(ctx context.Context, userID primitive.ObjectID) ([]primitive.ObjectID, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var deckIDs []primitive.ObjectID
	for cursor.Next(ctx) {
		var fav entities.Favorite
		if err := cursor.Decode(&fav); err == nil {
			deckIDs = append(deckIDs, fav.DeckID)
		}
	}
	return deckIDs, nil
}
