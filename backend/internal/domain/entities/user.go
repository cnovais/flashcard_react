package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email      string             `bson:"email" json:"email"`
	Name       string             `bson:"name" json:"name"`
	Password   string             `bson:"password,omitempty" json:"-"` // omitido do JSON por segurança
	Avatar     string             `bson:"avatar,omitempty" json:"avatar,omitempty"`
	Provider   string             `bson:"provider" json:"provider"` // "google", "linkedin"
	ProviderID string             `bson:"provider_id" json:"provider_id"`
	Plan       string             `bson:"plan" json:"plan"` // "free", "premium"
	XP         int                `bson:"xp" json:"xp"`
	Streak     int                `bson:"streak" json:"streak"`
	LastLogin  time.Time          `bson:"last_login" json:"last_login"`
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time          `bson:"updated_at" json:"updated_at"`
}

type UserStats struct {
	TotalDecks     int `json:"total_decks"`
	TotalCards     int `json:"total_cards"`
	TotalStudyTime int `json:"total_study_time"` // in minutes
	CurrentStreak  int `json:"current_streak"`
	LongestStreak  int `json:"longest_streak"`
}
