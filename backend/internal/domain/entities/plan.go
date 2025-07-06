package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Plan struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Type        string             `bson:"type" json:"type"` // "free", "premium"
	MaxDecks    int                `bson:"max_decks" json:"max_decks"`
	MaxCards    int                `bson:"max_cards" json:"max_cards"`
	Features    []string           `bson:"features" json:"features"`
	Price       float64            `bson:"price" json:"price"`
	Currency    string             `bson:"currency" json:"currency"`
	IsActive    bool               `bson:"is_active" json:"is_active"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type UserPlan struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
	PlanID    primitive.ObjectID `bson:"plan_id" json:"plan_id"`
	StartDate time.Time          `bson:"start_date" json:"start_date"`
	EndDate   time.Time          `bson:"end_date,omitempty" json:"end_date,omitempty"`
	IsActive  bool               `bson:"is_active" json:"is_active"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
} 