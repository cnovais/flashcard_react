package plans

import (
	"fmt"
	"time"

	"flashcard-backend/internal/config"
	"flashcard-backend/internal/domain/entities"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Service struct {
	repo *Repository
	cfg  *config.Config
}

func NewService(repo *Repository, cfg *config.Config) *Service {
	return &Service{
		repo: repo,
		cfg:  cfg,
	}
}

func (s *Service) GetAllPlans() ([]entities.Plan, error) {
	return s.repo.GetAllPlans()
}

func (s *Service) GetPlanByType(planType string) (*entities.Plan, error) {
	return s.repo.GetPlanByType(planType)
}

func (s *Service) GetUserPlan(userID string) (*entities.UserPlan, error) {
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	return s.repo.GetUserPlan(userObjectID)
}

func (s *Service) UpgradeUserPlan(userID, planType string) (*entities.UserPlan, error) {
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// Get the plan
	plan, err := s.repo.GetPlanByType(planType)
	if err != nil {
		return nil, fmt.Errorf("plan not found: %w", err)
	}

	// Deactivate current plan if exists
	_ = s.repo.DeactivateUserPlan(userObjectID)

	// Create new user plan
	userPlan := &entities.UserPlan{
		UserID:    userObjectID,
		PlanID:    plan.ID,
		StartDate: time.Now(),
		IsActive:  true,
	}

	if err := s.repo.CreateUserPlan(userPlan); err != nil {
		return nil, fmt.Errorf("failed to create user plan: %w", err)
	}

	return userPlan, nil
}

func (s *Service) DowngradeToFree(userID string) error {
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	return s.repo.DeactivateUserPlan(userObjectID)
}

func (s *Service) CheckUserLimits(userID string) (*UserLimits, error) {
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	userPlan, err := s.repo.GetUserPlan(userObjectID)
	if err != nil {
		// User has no active plan, return free plan limits
		return &UserLimits{
			MaxDecks: 3,
			MaxCards: 60,
			PlanType: "free",
		}, nil
	}

	plan, err := s.repo.GetPlanByID(userPlan.PlanID)
	if err != nil {
		return nil, fmt.Errorf("failed to get plan: %w", err)
	}

	return &UserLimits{
		MaxDecks: plan.MaxDecks,
		MaxCards: plan.MaxCards,
		PlanType: plan.Type,
	}, nil
}

type UserLimits struct {
	MaxDecks int    `json:"max_decks"`
	MaxCards int    `json:"max_cards"`
	PlanType string `json:"plan_type"`
}
