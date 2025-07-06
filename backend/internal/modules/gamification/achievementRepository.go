package gamification

import (
	"context"
	"time"

	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/infrastructure/database"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AchievementRepository struct {
	db *database.MongoDB
}

func NewAchievementRepository(db *database.MongoDB) *AchievementRepository {
	return &AchievementRepository{db: db}
}

func (r *AchievementRepository) CreateAchievement(achievement *entities.Achievement) error {
	achievement.CreatedAt = time.Now()
	achievement.UpdatedAt = time.Now()

	collection := r.db.Database.Collection("achievements")
	_, err := collection.InsertOne(context.Background(), achievement)
	return err
}

func (r *AchievementRepository) GetUserAchievements(userID string) ([]entities.Achievement, error) {
	collection := r.db.Database.Collection("achievements")

	cursor, err := collection.Find(context.Background(), bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var achievements []entities.Achievement
	if err = cursor.All(context.Background(), &achievements); err != nil {
		return nil, err
	}

	return achievements, nil
}

func (r *AchievementRepository) GetAchievementByID(id string) (*entities.Achievement, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	collection := r.db.Database.Collection("achievements")

	var achievement entities.Achievement
	err = collection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&achievement)
	if err != nil {
		return nil, err
	}

	return &achievement, nil
}

func (r *AchievementRepository) GetAchievementByUserAndName(userID, name string) (*entities.Achievement, error) {
	collection := r.db.Database.Collection("achievements")

	var achievement entities.Achievement
	err := collection.FindOne(context.Background(), bson.M{
		"user_id": userID,
		"name":    name,
	}).Decode(&achievement)
	if err != nil {
		return nil, err
	}

	return &achievement, nil
}

func (r *AchievementRepository) UpdateAchievement(achievement *entities.Achievement) error {
	achievement.UpdatedAt = time.Now()

	collection := r.db.Database.Collection("achievements")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"_id": achievement.ID},
		bson.M{"$set": achievement},
	)
	return err
}

func (r *AchievementRepository) UnlockAchievement(userID, name string, progress int) error {
	collection := r.db.Database.Collection("achievements")

	now := time.Now()
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{
			"user_id": userID,
			"name":    name,
		},
		bson.M{
			"$set": bson.M{
				"unlocked":    true,
				"unlocked_at": now,
				"progress":    progress,
				"updated_at":  now,
			},
		},
	)
	return err
}

func (r *AchievementRepository) UpdateProgress(userID, name string, progress int) error {
	collection := r.db.Database.Collection("achievements")

	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{
			"user_id": userID,
			"name":    name,
		},
		bson.M{
			"$set": bson.M{
				"progress":   progress,
				"updated_at": time.Now(),
			},
		},
	)
	return err
}

func (r *AchievementRepository) InitializeUserAchievements(userID string) error {
	collection := r.db.Database.Collection("achievements")

	// Verificar se o usuário já tem conquistas
	count, err := collection.CountDocuments(context.Background(), bson.M{"user_id": userID})
	if err != nil {
		return err
	}

	if count > 0 {
		return nil // Já tem conquistas
	}

	// Criar conquistas baseadas nos templates
	var achievements []interface{}
	for _, template := range entities.AchievementTemplates {
		achievement := entities.Achievement{
			UserID:      userID,
			Name:        template.Name,
			Description: template.Description,
			Icon:        template.Icon,
			Category:    template.Category,
			Condition:   template.Condition,
			Unlocked:    false,
			Progress:    0,
			Target:      template.Target,
			XP:          template.XP,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		achievements = append(achievements, achievement)
	}

	if len(achievements) > 0 {
		_, err = collection.InsertMany(context.Background(), achievements)
	}

	return err
}

func (r *AchievementRepository) GetUnlockedAchievements(userID string) ([]entities.Achievement, error) {
	collection := r.db.Database.Collection("achievements")

	cursor, err := collection.Find(context.Background(), bson.M{
		"user_id":  userID,
		"unlocked": true,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var achievements []entities.Achievement
	if err = cursor.All(context.Background(), &achievements); err != nil {
		return nil, err
	}

	return achievements, nil
}

func (r *AchievementRepository) GetAchievementsByCategory(userID, category string) ([]entities.Achievement, error) {
	collection := r.db.Database.Collection("achievements")

	cursor, err := collection.Find(context.Background(), bson.M{
		"user_id":  userID,
		"category": category,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var achievements []entities.Achievement
	if err = cursor.All(context.Background(), &achievements); err != nil {
		return nil, err
	}

	return achievements, nil
}
