package auth

import (
	"context"
	"time"

	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/infrastructure/database"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Repository struct {
	db *database.MongoDB
}

func NewRepository(db *database.MongoDB) *Repository {
	return &Repository{
		db: db,
	}
}

func (r *Repository) CreateUser(user *entities.User) error {
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	user.Plan = "free"
	user.XP = 0
	user.Streak = 0

	collection := r.db.GetCollection("users")
	_, err := collection.InsertOne(context.Background(), user)
	return err
}

func (r *Repository) GetUserByEmail(email string) (*entities.User, error) {
	collection := r.db.GetCollection("users")

	var user entities.User
	err := collection.FindOne(context.Background(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) GetUserByProviderID(provider, providerID string) (*entities.User, error) {
	collection := r.db.GetCollection("users")

	var user entities.User
	err := collection.FindOne(context.Background(), bson.M{
		"provider":    provider,
		"provider_id": providerID,
	}).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) UpdateUserLastLogin(userID primitive.ObjectID) error {
	collection := r.db.GetCollection("users")

	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{
			"last_login": time.Now(),
			"updated_at": time.Now(),
		}},
	)
	return err
}

func (r *Repository) UpdateUserAvatar(userID primitive.ObjectID, avatar string) error {
	collection := r.db.GetCollection("users")

	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{
			"avatar":     avatar,
			"updated_at": time.Now(),
		}},
	)
	return err
}

func (r *Repository) GetUserByID(userID string) (*entities.User, error) {
	collection := r.db.GetCollection("users")

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	var user entities.User
	err = collection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) UpdateUserProfile(userID primitive.ObjectID, name, email string) error {
	collection := r.db.GetCollection("users")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{
			"name":       name,
			"updated_at": time.Now(),
		}},
	)
	return err
}

// Password Reset Code methods
func (r *Repository) CreatePasswordResetCode(code *entities.PasswordResetCode) error {
	collection := r.db.GetCollection("password_reset_codes")
	_, err := collection.InsertOne(context.Background(), code)
	return err
}

func (r *Repository) GetPasswordResetCode(email, code string) (*entities.PasswordResetCode, error) {
	collection := r.db.GetCollection("password_reset_codes")
	var prc entities.PasswordResetCode
	err := collection.FindOne(context.Background(), bson.M{"email": email, "code": code, "used": false}).Decode(&prc)
	if err != nil {
		return nil, err
	}
	return &prc, nil
}

func (r *Repository) MarkPasswordResetCodeUsed(id primitive.ObjectID) error {
	collection := r.db.GetCollection("password_reset_codes")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"used": true}},
	)
	return err
}

func (r *Repository) UpdateUserPassword(email, hashedPassword string) error {
	collection := r.db.GetCollection("users")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"email": email},
		bson.M{"$set": bson.M{
			"password":   hashedPassword,
			"updated_at": time.Now(),
		}},
	)
	return err
}
