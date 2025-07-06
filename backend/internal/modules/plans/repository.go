package plans

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

func (r *Repository) CreatePlan(plan *entities.Plan) error {
	plan.CreatedAt = time.Now()
	plan.UpdatedAt = time.Now()

	collection := r.db.GetCollection("plans")
	_, err := collection.InsertOne(context.Background(), plan)
	return err
}

func (r *Repository) GetPlanByID(planID primitive.ObjectID) (*entities.Plan, error) {
	collection := r.db.GetCollection("plans")

	var plan entities.Plan
	err := collection.FindOne(context.Background(), bson.M{"_id": planID}).Decode(&plan)
	if err != nil {
		return nil, err
	}

	return &plan, nil
}

func (r *Repository) GetPlanByType(planType string) (*entities.Plan, error) {
	collection := r.db.GetCollection("plans")

	var plan entities.Plan
	err := collection.FindOne(context.Background(), bson.M{"type": planType, "is_active": true}).Decode(&plan)
	if err != nil {
		return nil, err
	}

	return &plan, nil
}

func (r *Repository) GetAllPlans() ([]entities.Plan, error) {
	collection := r.db.GetCollection("plans")

	cursor, err := collection.Find(context.Background(), bson.M{"is_active": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var plans []entities.Plan
	if err = cursor.All(context.Background(), &plans); err != nil {
		return nil, err
	}

	return plans, nil
}

func (r *Repository) UpdatePlan(plan *entities.Plan) error {
	plan.UpdatedAt = time.Now()

	collection := r.db.GetCollection("plans")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"_id": plan.ID},
		bson.M{"$set": plan},
	)
	return err
}

func (r *Repository) CreateUserPlan(userPlan *entities.UserPlan) error {
	userPlan.CreatedAt = time.Now()
	userPlan.UpdatedAt = time.Now()

	collection := r.db.GetCollection("user_plans")
	_, err := collection.InsertOne(context.Background(), userPlan)
	return err
}

func (r *Repository) GetUserPlan(userID primitive.ObjectID) (*entities.UserPlan, error) {
	collection := r.db.GetCollection("user_plans")

	var userPlan entities.UserPlan
	err := collection.FindOne(context.Background(), bson.M{
		"user_id":   userID,
		"is_active": true,
	}).Decode(&userPlan)
	if err != nil {
		return nil, err
	}

	return &userPlan, nil
}

func (r *Repository) UpdateUserPlan(userPlan *entities.UserPlan) error {
	userPlan.UpdatedAt = time.Now()

	collection := r.db.GetCollection("user_plans")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"_id": userPlan.ID},
		bson.M{"$set": userPlan},
	)
	return err
}

func (r *Repository) DeactivateUserPlan(userID primitive.ObjectID) error {
	collection := r.db.GetCollection("user_plans")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"user_id": userID, "is_active": true},
		bson.M{"$set": bson.M{
			"is_active":  false,
			"end_date":   time.Now(),
			"updated_at": time.Now(),
		}},
	)
	return err
}
