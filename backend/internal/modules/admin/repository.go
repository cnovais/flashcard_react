package admin

import (
	"context"
	"time"

	"flashcard-backend/internal/domain/entities"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AdminRepository struct {
	configCollection *mongo.Collection
	userCollection   *mongo.Collection
}

func NewAdminRepository(db *mongo.Database) *AdminRepository {
	return &AdminRepository{
		configCollection: db.Collection("admin_config"),
		userCollection:   db.Collection("admin_users"),
	}
}

// Config methods
func (r *AdminRepository) GetConfig(ctx context.Context) (*entities.AdminConfig, error) {
	var config entities.AdminConfig
	err := r.configCollection.FindOne(ctx, bson.M{}).Decode(&config)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Create default config if none exists
			config = entities.AdminConfig{
				FreePlanDeckLimit:        3,
				FreePlanPublicDeckLimit:  2,
				FreePlanPrivateDeckLimit: 1,
				FreePlanCardLimit:        60,
				PremiumPlanDeckLimit:     -1, // unlimited
				PremiumPlanCardLimit:     -1, // unlimited
				AdminEmails:              []string{},
				CreatedAt:                time.Now(),
				UpdatedAt:                time.Now(),
			}
			_, err = r.configCollection.InsertOne(ctx, config)
			if err != nil {
				return nil, err
			}
			return &config, nil
		}
		return nil, err
	}
	return &config, nil
}

func (r *AdminRepository) UpdateConfig(ctx context.Context, config *entities.AdminConfig) error {
	config.UpdatedAt = time.Now()
	_, err := r.configCollection.UpdateOne(
		ctx,
		bson.M{"_id": config.ID},
		bson.M{"$set": config},
	)
	return err
}

// Admin user methods
func (r *AdminRepository) CreateAdminUser(ctx context.Context, adminUser *entities.AdminUser) error {
	adminUser.CreatedAt = time.Now()
	adminUser.UpdatedAt = time.Now()
	_, err := r.userCollection.InsertOne(ctx, adminUser)
	return err
}

func (r *AdminRepository) GetAdminUserByEmail(ctx context.Context, email string) (*entities.AdminUser, error) {
	var adminUser entities.AdminUser
	err := r.userCollection.FindOne(ctx, bson.M{"email": email}).Decode(&adminUser)
	if err != nil {
		return nil, err
	}
	return &adminUser, nil
}

func (r *AdminRepository) GetAdminUserByUserID(ctx context.Context, userID primitive.ObjectID) (*entities.AdminUser, error) {
	var adminUser entities.AdminUser
	err := r.userCollection.FindOne(ctx, bson.M{"userId": userID}).Decode(&adminUser)
	if err != nil {
		return nil, err
	}
	return &adminUser, nil
}

func (r *AdminRepository) UpdateAdminUser(ctx context.Context, adminUser *entities.AdminUser) error {
	adminUser.UpdatedAt = time.Now()
	_, err := r.userCollection.UpdateOne(
		ctx,
		bson.M{"_id": adminUser.ID},
		bson.M{"$set": adminUser},
	)
	return err
}

func (r *AdminRepository) DeleteAdminUser(ctx context.Context, adminUserID primitive.ObjectID) error {
	_, err := r.userCollection.DeleteOne(ctx, bson.M{"_id": adminUserID})
	return err
}

func (r *AdminRepository) GetAllAdminUsers(ctx context.Context) ([]entities.AdminUser, error) {
	cursor, err := r.userCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var adminUsers []entities.AdminUser
	if err = cursor.All(ctx, &adminUsers); err != nil {
		return nil, err
	}
	return adminUsers, nil
}
