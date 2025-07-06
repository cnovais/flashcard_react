package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// StudyStats representa estatísticas detalhadas de estudo
type StudyStats struct {
	ID         primitive.ObjectID     `bson:"_id,omitempty" json:"id,omitempty"`
	UserID     string                 `bson:"user_id" json:"user_id"`
	DeckID     string                 `bson:"deck_id,omitempty" json:"deck_id,omitempty"`
	CardID     string                 `bson:"card_id,omitempty" json:"card_id,omitempty"`
	ActionType string                 `bson:"action_type" json:"action_type"`                   // "study_session_start", "study_session_end", "card_review", "deck_created", "card_created", "achievement_unlocked"
	Difficulty string                 `bson:"difficulty,omitempty" json:"difficulty,omitempty"` // "easy", "good", "hard", "again"
	IsCorrect  *bool                  `bson:"is_correct,omitempty" json:"is_correct,omitempty"`
	StudyTime  int                    `bson:"study_time,omitempty" json:"study_time,omitempty"` // em segundos
	SessionID  string                 `bson:"session_id,omitempty" json:"session_id,omitempty"`
	XP         int                    `bson:"xp,omitempty" json:"xp,omitempty"`
	Streak     int                    `bson:"streak,omitempty" json:"streak,omitempty"`
	Level      int                    `bson:"level,omitempty" json:"level,omitempty"`
	Metadata   map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"` // dados adicionais específicos da ação
	CreatedAt  time.Time              `bson:"created_at" json:"created_at"`
	Date       time.Time              `bson:"date" json:"date"`   // data para agrupamento (sem hora)
	Week       int                    `bson:"week" json:"week"`   // semana do ano
	Month      int                    `bson:"month" json:"month"` // mês do ano
	Year       int                    `bson:"year" json:"year"`   // ano
}

// StudyStatsSummary representa um resumo das estatísticas
type StudyStatsSummary struct {
	TotalStudyTime       int     `json:"total_study_time"`
	TotalSessions        int     `json:"total_sessions"`
	TotalCards           int     `json:"total_cards"`
	AverageAccuracy      float64 `json:"average_accuracy"`
	StudyStreak          int     `json:"study_streak"`
	TotalXP              int     `json:"total_xp"`
	CurrentLevel         int     `json:"current_level"`
	DecksCreated         int     `json:"decks_created"`
	CardsCreated         int     `json:"cards_created"`
	AchievementsUnlocked int     `json:"achievements_unlocked"`
}

// StudyStatsByPeriod representa estatísticas agrupadas por período
type StudyStatsByPeriod struct {
	Period        string  `json:"period"` // "day", "week", "month"
	Date          string  `json:"date"`
	StudyTime     int     `json:"study_time"`
	Sessions      int     `json:"sessions"`
	CardsReviewed int     `json:"cards_reviewed"`
	Accuracy      float64 `json:"accuracy"`
	XP            int     `json:"xp"`
}

// PerformanceByDifficulty representa performance por dificuldade
type PerformanceByDifficulty struct {
	Difficulty  string  `json:"difficulty"`
	Count       int     `json:"count"`
	Percentage  float64 `json:"percentage"`
	AverageTime float64 `json:"average_time"`
}

// DeckPerformance representa performance por deck
type DeckPerformance struct {
	DeckID        string     `json:"deck_id"`
	DeckName      string     `json:"deck_name"`
	StudyTime     int        `json:"study_time"`
	Sessions      int        `json:"sessions"`
	CardsReviewed int        `json:"cards_reviewed"`
	Accuracy      float64    `json:"accuracy"`
	LastStudied   *time.Time `json:"last_studied,omitempty"`
}

// DetailedStats representa estatísticas detalhadas
type DetailedStats struct {
	StudyStatsByPeriod      []StudyStatsByPeriod      `json:"study_stats_by_period"`
	PerformanceByDifficulty []PerformanceByDifficulty `json:"performance_by_difficulty"`
	DeckPerformance         []DeckPerformance         `json:"deck_performance"`
}

// TimeDistribution representa a distribuição de estudo por período do dia
type TimeDistribution struct {
	Morning         int `json:"morning"`   // 6h-12h
	Afternoon       int `json:"afternoon"` // 12h-18h
	Evening         int `json:"evening"`   // 18h-24h
	Night           int `json:"night"`     // 0h-6h
	TotalStudyTime  int `json:"total_study_time"`
	LongestSession  int `json:"longest_session"`
	ShortestSession int `json:"shortest_session"`
	AverageTime     int `json:"average_time"`
}
