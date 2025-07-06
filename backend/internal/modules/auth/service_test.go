package auth

import (
	"testing"

	"flashcard-backend/internal/config"
	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/infrastructure/database"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Mock Repository
type MockRepository struct {
	mock.Mock
}

func (m *MockRepository) CreateUser(user *entities.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockRepository) GetUserByEmail(email string) (*entities.User, error) {
	args := m.Called(email)
	return args.Get(0).(*entities.User), args.Error(1)
}

func (m *MockRepository) GetUserByProviderID(provider, providerID string) (*entities.User, error) {
	args := m.Called(provider, providerID)
	return args.Get(0).(*entities.User), args.Error(1)
}

func (m *MockRepository) UpdateUserLastLogin(userID primitive.ObjectID) error {
	args := m.Called(userID)
	return args.Error(0)
}

func (m *MockRepository) UpdateUserAvatar(userID primitive.ObjectID, avatar string) error {
	args := m.Called(userID, avatar)
	return args.Error(0)
}

func TestUpdateAvatar(t *testing.T) {
	// Setup
	mockRepo := new(MockRepository)
	cfg := &config.Config{
		Auth: config.AuthConfig{
			JWTSecret: "test-secret",
			JWTExpiry: 24,
		},
	}
	service := NewService(mockRepo, cfg)

	userID := "507f1f77bcf86cd799439011"
	avatar := "https://example.com/avatar.jpg"

	// Mock expectations
	mockRepo.On("UpdateUserAvatar", mock.AnythingOfType("primitive.ObjectID"), avatar).Return(nil)

	// Test
	err := service.UpdateAvatar(userID, avatar)

	// Assertions
	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestUpdateAvatarInvalidUserID(t *testing.T) {
	// Setup
	mockRepo := new(MockRepository)
	cfg := &config.Config{
		Auth: config.AuthConfig{
			JWTSecret: "test-secret",
			JWTExpiry: 24,
		},
	}
	service := NewService(mockRepo, cfg)

	invalidUserID := "invalid-id"
	avatar := "https://example.com/avatar.jpg"

	// Test
	err := service.UpdateAvatar(invalidUserID, avatar)

	// Assertions
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid user ID")
} 