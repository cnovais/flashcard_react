package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Deck struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID      string             `bson:"userId" json:"user_id"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	Tags        []string           `bson:"tags,omitempty" json:"tags,omitempty"`
	Color       string             `bson:"color,omitempty" json:"color,omitempty"`
	Border      string             `bson:"border,omitempty" json:"border,omitempty"`
	Background  string             `bson:"background,omitempty" json:"background,omitempty"`
	CardCount   int                `bson:"cardCount" json:"card_count"`
	IsPublic    bool               `bson:"isPublic" json:"is_public"`
	CreatedAt   time.Time          `bson:"createdAt" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updated_at"`
}

type DeckStats struct {
	TotalCards             int         `json:"total_cards"`
	ReviewedCards          int         `json:"reviewed_cards"`
	AverageDifficulty      int         `json:"average_difficulty"`
	DifficultyDistribution map[int]int `json:"difficulty_distribution"`
}
