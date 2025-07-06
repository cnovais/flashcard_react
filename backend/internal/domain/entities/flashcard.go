package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Flashcard struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	DeckID             string             `bson:"deckId" json:"deck_id"`
	UserID             primitive.ObjectID `bson:"userId" json:"user_id"`
	Question           string             `bson:"question" json:"question"`
	Answer             string             `bson:"answer" json:"answer"`
	Alternatives       []string           `bson:"alternatives,omitempty" json:"alternatives,omitempty"`
	CorrectAlternative *int               `bson:"correctAlternative,omitempty" json:"correctAlternative,omitempty"`
	ImageURL           *string            `bson:"imageUrl,omitempty" json:"image_url,omitempty"`
	AudioURL           *string            `bson:"audioUrl,omitempty" json:"audio_url,omitempty"`
	Tags               []string           `bson:"tags,omitempty" json:"tags,omitempty"`
	Difficulty         int                `bson:"difficulty" json:"difficulty"` // 1-5 scale
	ReviewCount        int                `bson:"reviewCount" json:"review_count"`
	LastReviewed       *time.Time         `bson:"lastReviewed,omitempty" json:"last_reviewed,omitempty"`
	NextReview         *time.Time         `bson:"nextReview,omitempty" json:"next_review,omitempty"`
	CreatedAt          time.Time          `bson:"createdAt" json:"created_at"`
	UpdatedAt          time.Time          `bson:"updatedAt" json:"updated_at"`
}

type StudySession struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID        primitive.ObjectID `bson:"user_id" json:"user_id"`
	DeckID        primitive.ObjectID `bson:"deck_id" json:"deck_id"`
	StartTime     time.Time          `bson:"start_time" json:"start_time"`
	EndTime       time.Time          `bson:"end_time,omitempty" json:"end_time,omitempty"`
	Duration      int                `bson:"duration" json:"duration"` // in minutes
	CardsReviewed int                `bson:"cards_reviewed" json:"cards_reviewed"`
	Score         float64            `bson:"score" json:"score"` // percentage correct
}
