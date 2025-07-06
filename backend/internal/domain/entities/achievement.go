package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Achievement struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	UserID      string               `bson:"user_id" json:"user_id"`
	Name        string               `bson:"name" json:"name"`
	Description string               `bson:"description" json:"description"`
	Icon        string               `bson:"icon" json:"icon"`
	Category    string               `bson:"category" json:"category"` // study, creation, streak, accuracy, etc.
	Condition   AchievementCondition `bson:"condition" json:"condition"`
	Unlocked    bool                 `bson:"unlocked" json:"unlocked"`
	UnlockedAt  *time.Time           `bson:"unlocked_at,omitempty" json:"unlocked_at,omitempty"`
	Progress    int                  `bson:"progress" json:"progress"`
	Target      int                  `bson:"target" json:"target"`
	XP          int                  `bson:"xp" json:"xp"`
	CreatedAt   time.Time            `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time            `bson:"updated_at" json:"updated_at"`
}

type AchievementCondition struct {
	Type      string `bson:"type" json:"type"`         // total_cards, total_decks, study_streak, accuracy, study_time, etc.
	Operator  string `bson:"operator" json:"operator"` // >=, <=, ==, etc.
	Value     int    `bson:"value" json:"value"`
	TimeFrame string `bson:"time_frame" json:"time_frame"` // daily, weekly, monthly, all_time
}

// Achievement templates
var AchievementTemplates = []Achievement{
	{
		Name:        "Primeiro Passo",
		Description: "Crie seu primeiro deck",
		Icon:        "🎯",
		Category:    "creation",
		Condition: AchievementCondition{
			Type:     "total_decks",
			Operator: ">=",
			Value:    1,
		},
		Target: 1,
		XP:     50,
	},
	{
		Name:        "Criador de Conteúdo",
		Description: "Crie 5 decks",
		Icon:        "📚",
		Category:    "creation",
		Condition: AchievementCondition{
			Type:     "total_decks",
			Operator: ">=",
			Value:    5,
		},
		Target: 5,
		XP:     100,
	},
	{
		Name:        "Mestre dos Cards",
		Description: "Crie 50 cards",
		Icon:        "🃏",
		Category:    "creation",
		Condition: AchievementCondition{
			Type:     "total_cards",
			Operator: ">=",
			Value:    50,
		},
		Target: 50,
		XP:     200,
	},
	{
		Name:        "Estudante Dedicado",
		Description: "Complete 10 sessões de estudo",
		Icon:        "📖",
		Category:    "study",
		Condition: AchievementCondition{
			Type:     "total_sessions",
			Operator: ">=",
			Value:    10,
		},
		Target: 10,
		XP:     150,
	},
	{
		Name:        "Maratonista",
		Description: "Estude por 1 hora total",
		Icon:        "⏰",
		Category:    "study",
		Condition: AchievementCondition{
			Type:     "total_study_time",
			Operator: ">=",
			Value:    3600, // 1 hora em segundos
		},
		Target: 3600,
		XP:     100,
	},
	{
		Name:        "Consistente",
		Description: "Mantenha uma sequência de 3 dias",
		Icon:        "🔥",
		Category:    "streak",
		Condition: AchievementCondition{
			Type:     "study_streak",
			Operator: ">=",
			Value:    3,
		},
		Target: 3,
		XP:     75,
	},
	{
		Name:        "Invencível",
		Description: "Mantenha uma sequência de 7 dias",
		Icon:        "👑",
		Category:    "streak",
		Condition: AchievementCondition{
			Type:     "study_streak",
			Operator: ">=",
			Value:    7,
		},
		Target: 7,
		XP:     200,
	},
	{
		Name:        "Preciso",
		Description: "Alcance 80% de precisão em uma sessão",
		Icon:        "🎯",
		Category:    "accuracy",
		Condition: AchievementCondition{
			Type:     "session_accuracy",
			Operator: ">=",
			Value:    80,
		},
		Target: 80,
		XP:     100,
	},
	{
		Name:        "Perfeccionista",
		Description: "Alcance 95% de precisão em uma sessão",
		Icon:        "💎",
		Category:    "accuracy",
		Condition: AchievementCondition{
			Type:     "session_accuracy",
			Operator: ">=",
			Value:    95,
		},
		Target: 95,
		XP:     300,
	},
	{
		Name:        "Velocista",
		Description: "Complete 20 cards em uma sessão",
		Icon:        "⚡",
		Category:    "study",
		Condition: AchievementCondition{
			Type:     "cards_per_session",
			Operator: ">=",
			Value:    20,
		},
		Target: 20,
		XP:     150,
	},
}

type UserAchievement struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID        primitive.ObjectID `bson:"user_id" json:"user_id"`
	AchievementID string             `bson:"achievement_id" json:"achievement_id"`
	UnlockedAt    time.Time          `bson:"unlocked_at" json:"unlocked_at"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
}
