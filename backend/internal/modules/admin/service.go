package admin

import (
	"context"
	"errors"
	"fmt"

	"flashcard-backend/internal/domain/entities"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Service struct {
	repo *AdminRepository
}

func NewService(repo *AdminRepository) *Service {
	return &Service{repo: repo}
}

// Config methods
func (s *Service) GetConfig(ctx context.Context) (*entities.AdminConfig, error) {
	return s.repo.GetConfig(ctx)
}

func (s *Service) UpdateConfig(ctx context.Context, config *entities.AdminConfig) error {
	return s.repo.UpdateConfig(ctx, config)
}

// Validation methods
func (s *Service) ValidateDeckLimit(ctx context.Context, userPlan string, currentDeckCount int, isPublic bool) error {
	fmt.Printf("🔍 VALIDATE DECK LIMIT - Iniciando validação\n")
	fmt.Printf("🔍 VALIDATE DECK LIMIT - userPlan: %s\n", userPlan)
	fmt.Printf("🔍 VALIDATE DECK LIMIT - currentDeckCount: %d\n", currentDeckCount)
	fmt.Printf("🔍 VALIDATE DECK LIMIT - isPublic: %v\n", isPublic)

	config, err := s.repo.GetConfig(ctx)
	if err != nil {
		fmt.Printf("🔍 VALIDATE DECK LIMIT - ERRO ao buscar config: %v\n", err)
		return fmt.Errorf("failed to get config: %w", err)
	}

	fmt.Printf("🔍 VALIDATE DECK LIMIT - Config encontrada: %+v\n", config)

	if userPlan == "premium" {
		fmt.Printf("🔍 VALIDATE DECK LIMIT - Usuário premium, permitindo\n")
		return nil // ilimitado
	}

	if isPublic {
		limit := config.FreePlanPublicDeckLimit
		fmt.Printf("🔍 VALIDATE DECK LIMIT - Validando público: %d >= %d\n", currentDeckCount, limit)
		if limit != -1 && currentDeckCount >= limit {
			fmt.Printf("🔍 VALIDATE DECK LIMIT - ERRO: limite público atingido\n")
			return errors.New(fmt.Sprintf("Limite de %d decks públicos atingido. Torne-se premium para ilimitado.", limit))
		}
	} else {
		limit := config.FreePlanPrivateDeckLimit
		fmt.Printf("🔍 VALIDATE DECK LIMIT - Validando privado: %d >= %d\n", currentDeckCount, limit)
		if limit != -1 && currentDeckCount >= limit {
			fmt.Printf("🔍 VALIDATE DECK LIMIT - ERRO: limite privado atingido\n")
			return errors.New(fmt.Sprintf("Limite de %d decks privados atingido. Torne-se premium para ilimitado.", limit))
		}
	}

	fmt.Printf("🔍 VALIDATE DECK LIMIT - Validação passou\n")
	return nil
}

func (s *Service) ValidateCardLimit(ctx context.Context, userPlan string, currentCardCount int) error {
	config, err := s.repo.GetConfig(ctx)
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}

	if userPlan == "premium" {
		return nil // ilimitado
	}

	limit := config.FreePlanCardLimit
	if limit != -1 && currentCardCount >= limit {
		return errors.New(fmt.Sprintf("Limite de %d cards por deck atingido. Torne-se premium para ilimitado.", limit))
	}

	return nil
}

// Adicionado para compatibilidade de interface
func (s *Service) ValidatePublicDeckLimit(ctx context.Context, userPlan string, currentPublicDeckCount int) error {
	return nil // Não usado, apenas para interface
}

func (s *Service) ValidatePublicCardLimit(ctx context.Context, userPlan string, currentPublicCardCount int) error {
	return nil // Não usado, apenas para interface
}

// Admin user methods
func (s *Service) CreateAdminUser(ctx context.Context, userID primitive.ObjectID, email, role string) (*entities.AdminUser, error) {
	adminUser := &entities.AdminUser{
		UserID:   userID,
		Email:    email,
		Role:     role,
		IsActive: true,
	}

	err := s.repo.CreateAdminUser(ctx, adminUser)
	if err != nil {
		return nil, fmt.Errorf("failed to create admin user: %w", err)
	}

	return adminUser, nil
}

func (s *Service) GetAdminUserByEmail(ctx context.Context, email string) (*entities.AdminUser, error) {
	return s.repo.GetAdminUserByEmail(ctx, email)
}

func (s *Service) GetAdminUserByUserID(ctx context.Context, userID primitive.ObjectID) (*entities.AdminUser, error) {
	return s.repo.GetAdminUserByUserID(ctx, userID)
}

func (s *Service) UpdateAdminUser(ctx context.Context, adminUser *entities.AdminUser) error {
	return s.repo.UpdateAdminUser(ctx, adminUser)
}

func (s *Service) DeleteAdminUser(ctx context.Context, adminUserID primitive.ObjectID) error {
	return s.repo.DeleteAdminUser(ctx, adminUserID)
}

func (s *Service) GetAllAdminUsers(ctx context.Context) ([]entities.AdminUser, error) {
	return s.repo.GetAllAdminUsers(ctx)
}

func (s *Service) IsAdmin(ctx context.Context, userID primitive.ObjectID) (bool, error) {
	adminUser, err := s.repo.GetAdminUserByUserID(ctx, userID)
	if err != nil {
		return false, nil // Not an admin
	}
	return adminUser.IsActive, nil
}
