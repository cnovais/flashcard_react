package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

type MongoDB struct {
	Client   *mongo.Client
	Database *mongo.Database
}

func NewMongoDB(uri, dbName string) (*MongoDB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %v", err)
	}

	// Ping the database
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %v", err)
	}

	database := client.Database(dbName)

	// Create indexes
	if err := createIndexes(ctx, database); err != nil {
		log.Printf("Warning: failed to create indexes: %v", err)
	}

	log.Printf("Connected to MongoDB database: %s", dbName)
	return &MongoDB{
		Client:   client,
		Database: database,
	}, nil
}

func (m *MongoDB) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return m.Client.Disconnect(ctx)
}

func (m *MongoDB) GetCollection(name string) *mongo.Collection {
	return m.Database.Collection(name)
}

func createIndexes(ctx context.Context, db *mongo.Database) error {
	// Users collection indexes
	usersCollection := db.Collection("users")
	_, err := usersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]interface{}{
			"email": 1,
		},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return fmt.Errorf("failed to create users email index: %v", err)
	}

	// Decks collection indexes
	decksCollection := db.Collection("decks")
	_, err = decksCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]interface{}{
			"userId": 1,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create decks userId index: %v", err)
	}

	// Cards collection indexes
	cardsCollection := db.Collection("cards")
	_, err = cardsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]interface{}{
			"deckId": 1,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create cards deckId index: %v", err)
	}

	// Study sessions collection indexes
	sessionsCollection := db.Collection("study_sessions")
	_, err = sessionsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]interface{}{
			"userId": 1,
			"date":   -1,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create study_sessions userId_date index: %v", err)
	}

	// Notifications collection indexes
	notificationsCollection := db.Collection("notifications")
	_, err = notificationsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]interface{}{
			"userId": 1,
			"isRead": 1,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create notifications userId_isRead index: %v", err)
	}

	// Study stats collection indexes
	studyStatsCollection := db.Collection("study_stats")
	_, err = studyStatsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]interface{}{
			"user_id":    1,
			"created_at": -1,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create study_stats user_id_created_at index: %v", err)
	}

	// Index for action type queries
	_, err = studyStatsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]interface{}{
			"user_id":     1,
			"action_type": 1,
			"created_at":  -1,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create study_stats user_id_action_type_created_at index: %v", err)
	}

	// Index for deck performance queries
	_, err = studyStatsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]interface{}{
			"user_id":    1,
			"deck_id":    1,
			"created_at": -1,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create study_stats user_id_deck_id_created_at index: %v", err)
	}

	// Index for date-based queries
	_, err = studyStatsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]interface{}{
			"user_id": 1,
			"date":    -1,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create study_stats user_id_date index: %v", err)
	}

	// Achievements collection indexes
	achievementsCollection := db.Collection("achievements")
	_, err = achievementsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]interface{}{
			"user_id": 1,
			"name":    1,
		},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return fmt.Errorf("failed to create achievements user_id_name index: %v", err)
	}

	// Index for unlocked achievements
	_, err = achievementsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]interface{}{
			"user_id":  1,
			"unlocked": 1,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create achievements user_id_unlocked index: %v", err)
	}

	// Index for achievements by category
	_, err = achievementsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: map[string]interface{}{
			"user_id":  1,
			"category": 1,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create achievements user_id_category index: %v", err)
	}

	return nil
}
