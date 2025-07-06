package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AdminConfig struct {
	ID                       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	FreePlanDeckLimit        int                `bson:"freePlanDeckLimit" json:"free_plan_deck_limit"`
	FreePlanPublicDeckLimit  int                `bson:"freePlanPublicDeckLimit" json:"free_plan_public_deck_limit"`
	FreePlanPrivateDeckLimit int                `bson:"freePlanPrivateDeckLimit" json:"free_plan_private_deck_limit"`
	FreePlanCardLimit        int                `bson:"freePlanCardLimit" json:"free_plan_card_limit"`
	PremiumPlanDeckLimit     int                `bson:"premiumPlanDeckLimit" json:"premium_plan_deck_limit"`
	PremiumPlanCardLimit     int                `bson:"premiumPlanCardLimit" json:"premium_plan_card_limit"`
	AdminEmails              []string           `bson:"adminEmails" json:"admin_emails"`
	CreatedAt                time.Time          `bson:"createdAt" json:"created_at"`
	UpdatedAt                time.Time          `bson:"updatedAt" json:"updated_at"`
}

type AdminUser struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"userId" json:"user_id"`
	Email     string             `bson:"email" json:"email"`
	Role      string             `bson:"role" json:"role"` // "admin", "super_admin"
	IsActive  bool               `bson:"isActive" json:"is_active"`
	CreatedAt time.Time          `bson:"createdAt" json:"created_at"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updated_at"`
}
