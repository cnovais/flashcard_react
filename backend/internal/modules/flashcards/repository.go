package flashcards

import (
	"context"
	"fmt"
	"time"

	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/infrastructure/database"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoRepository struct {
	db         *database.MongoDB
	collection *mongo.Collection
}

type Repository struct {
	db *database.MongoDB
}

func NewMongoRepository(db *database.MongoDB) *MongoRepository {
	return &MongoRepository{
		db:         db,
		collection: db.GetCollection("cards"),
	}
}

func NewRepository(db *database.MongoDB) *Repository {
	return &Repository{
		db: db,
	}
}

type CardDocument struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty"`
	DeckID             string             `bson:"deckId"`
	UserID             primitive.ObjectID `bson:"userId"`
	Question           string             `bson:"question"`
	Answer             string             `bson:"answer"`
	Alternatives       []string           `bson:"alternatives,omitempty"`
	CorrectAlternative *int               `bson:"correctAlternative,omitempty"`
	ImageURL           *string            `bson:"imageUrl,omitempty"`
	AudioURL           *string            `bson:"audioUrl,omitempty"`
	Tags               []string           `bson:"tags,omitempty"`
	Difficulty         int                `bson:"difficulty"`
	ReviewCount        int                `bson:"reviewCount"`
	LastReviewed       *time.Time         `bson:"lastReviewed,omitempty"`
	NextReview         *time.Time         `bson:"nextReview,omitempty"`
	CreatedAt          time.Time          `bson:"createdAt"`
	UpdatedAt          time.Time          `bson:"updatedAt"`
}

func (r *MongoRepository) Create(ctx context.Context, card *entities.Flashcard) error {
	doc := CardDocument{
		DeckID:             card.DeckID,
		UserID:             card.UserID,
		Question:           card.Question,
		Answer:             card.Answer,
		Alternatives:       card.Alternatives,
		CorrectAlternative: card.CorrectAlternative,
		ImageURL:           card.ImageURL,
		AudioURL:           card.AudioURL,
		Tags:               card.Tags,
		Difficulty:         card.Difficulty,
		ReviewCount:        0,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	result, err := r.collection.InsertOne(ctx, doc)
	if err != nil {
		return fmt.Errorf("failed to insert card: %v", err)
	}

	card.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *MongoRepository) GetByDeckID(ctx context.Context, deckID string) ([]*entities.Flashcard, error) {
	filter := bson.M{"deckId": deckID}
	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to find cards: %v", err)
	}
	defer cursor.Close(ctx)

	var cards []*entities.Flashcard
	for cursor.Next(ctx) {
		var doc CardDocument
		if err := cursor.Decode(&doc); err != nil {
			return nil, fmt.Errorf("failed to decode card: %v", err)
		}
		cards = append(cards, r.documentToEntity(&doc))
	}

	return cards, nil
}

func (r *MongoRepository) GetByID(ctx context.Context, id string) (*entities.Flashcard, error) {
	fmt.Printf("GetByID called with id: %s\n", id)

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		fmt.Printf("Error converting ID to ObjectID: %v\n", err)
		return nil, fmt.Errorf("invalid card ID: %v", err)
	}

	fmt.Printf("Converted ObjectID: %v\n", objID)

	filter := bson.M{"_id": objID}
	fmt.Printf("Filter: %+v\n", filter)

	var doc CardDocument
	err = r.collection.FindOne(ctx, filter).Decode(&doc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			fmt.Printf("No document found for ID: %s\n", id)
			return nil, fmt.Errorf("card not found")
		}
		fmt.Printf("Error finding card: %v\n", err)
		return nil, fmt.Errorf("failed to find card: %v", err)
	}

	fmt.Printf("Found document: %+v\n", doc)
	return r.documentToEntity(&doc), nil
}

func (r *MongoRepository) Update(ctx context.Context, card *entities.Flashcard) error {
	update := bson.M{
		"$set": bson.M{
			"question":           card.Question,
			"answer":             card.Answer,
			"alternatives":       card.Alternatives,
			"correctAlternative": card.CorrectAlternative,
			"imageUrl":           card.ImageURL,
			"audioUrl":           card.AudioURL,
			"tags":               card.Tags,
			"difficulty":         card.Difficulty,
			"updatedAt":          time.Now(),
		},
	}

	filter := bson.M{"_id": card.ID}
	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update card: %v", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("card not found")
	}

	return nil
}

func (r *MongoRepository) Delete(ctx context.Context, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid card ID: %v", err)
	}

	filter := bson.M{"_id": objID}
	result, err := r.collection.DeleteOne(ctx, filter)
	if err != nil {
		return fmt.Errorf("failed to delete card: %v", err)
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("card not found")
	}

	return nil
}

func (r *MongoRepository) GetDueForReview(ctx context.Context, userID string) ([]*entities.Flashcard, error) {
	// Get decks for the user first
	decksCollection := r.db.GetCollection("decks")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %v", err)
	}

	deckFilter := bson.M{"userId": userObjID}
	deckCursor, err := decksCollection.Find(ctx, deckFilter)
	if err != nil {
		return nil, fmt.Errorf("failed to find user decks: %v", err)
	}
	defer deckCursor.Close(ctx)

	var deckIDs []primitive.ObjectID
	for deckCursor.Next(ctx) {
		var deck struct {
			ID primitive.ObjectID `bson:"_id"`
		}
		if err := deckCursor.Decode(&deck); err != nil {
			return nil, fmt.Errorf("failed to decode deck: %v", err)
		}
		deckIDs = append(deckIDs, deck.ID)
	}

	if len(deckIDs) == 0 {
		return []*entities.Flashcard{}, nil
	}

	// Get cards due for review
	now := time.Now()
	filter := bson.M{
		"deckId": bson.M{"$in": deckIDs},
		"$or": []bson.M{
			{"nextReview": bson.M{"$lte": now}},
			{"nextReview": bson.M{"$exists": false}},
		},
	}

	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to find cards due for review: %v", err)
	}
	defer cursor.Close(ctx)

	var cards []*entities.Flashcard
	for cursor.Next(ctx) {
		var doc CardDocument
		if err := cursor.Decode(&doc); err != nil {
			return nil, fmt.Errorf("failed to decode card: %v", err)
		}
		cards = append(cards, r.documentToEntity(&doc))
	}

	return cards, nil
}

func (r *MongoRepository) UpdateReview(ctx context.Context, cardID string, isCorrect bool) error {
	objID, err := primitive.ObjectIDFromHex(cardID)
	if err != nil {
		return fmt.Errorf("invalid card ID: %v", err)
	}

	// Calculate next review using spaced repetition algorithm
	now := time.Now()
	var nextReview time.Time

	// Simple spaced repetition: 1, 3, 7, 14, 30, 90 days
	intervals := []int{1, 3, 7, 14, 30, 90}

	// Get current card to check review count
	var doc CardDocument
	filter := bson.M{"_id": objID}
	err = r.collection.FindOne(ctx, filter).Decode(&doc)
	if err != nil {
		return fmt.Errorf("failed to find card: %v", err)
	}

	reviewCount := doc.ReviewCount
	if isCorrect {
		reviewCount++
	} else {
		// Reset to beginning if incorrect
		reviewCount = 0
	}

	// Calculate next review interval
	intervalIndex := reviewCount
	if intervalIndex >= len(intervals) {
		intervalIndex = len(intervals) - 1
	}

	days := intervals[intervalIndex]
	nextReview = now.AddDate(0, 0, days)

	update := bson.M{
		"$set": bson.M{
			"reviewCount":  reviewCount,
			"lastReviewed": now,
			"nextReview":   nextReview,
			"updatedAt":    now,
		},
	}

	_, err = r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update card review: %v", err)
	}

	return nil
}

func (r *MongoRepository) GetStatsByDeck(ctx context.Context, deckID string) (*entities.DeckStats, error) {
	objID, err := primitive.ObjectIDFromHex(deckID)
	if err != nil {
		return nil, fmt.Errorf("invalid deck ID: %v", err)
	}

	filter := bson.M{"deckId": objID}
	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to find cards: %v", err)
	}
	defer cursor.Close(ctx)

	var totalCards, reviewedCards int
	var totalDifficulty int
	difficultyCount := make(map[int]int)

	for cursor.Next(ctx) {
		var doc CardDocument
		if err := cursor.Decode(&doc); err != nil {
			return nil, fmt.Errorf("failed to decode card: %v", err)
		}

		totalCards++
		totalDifficulty += doc.Difficulty
		difficultyCount[doc.Difficulty]++

		if doc.LastReviewed != nil {
			reviewedCards++
		}
	}

	avgDifficulty := 0
	if totalCards > 0 {
		avgDifficulty = totalDifficulty / totalCards
	}

	return &entities.DeckStats{
		TotalCards:             totalCards,
		ReviewedCards:          reviewedCards,
		AverageDifficulty:      avgDifficulty,
		DifficultyDistribution: difficultyCount,
	}, nil
}

func (r *MongoRepository) documentToEntity(doc *CardDocument) *entities.Flashcard {
	return &entities.Flashcard{
		ID:                 doc.ID,
		DeckID:             doc.DeckID,
		UserID:             doc.UserID,
		Question:           doc.Question,
		Answer:             doc.Answer,
		Alternatives:       doc.Alternatives,
		CorrectAlternative: doc.CorrectAlternative,
		ImageURL:           doc.ImageURL,
		AudioURL:           doc.AudioURL,
		Tags:               doc.Tags,
		Difficulty:         doc.Difficulty,
		ReviewCount:        doc.ReviewCount,
		LastReviewed:       doc.LastReviewed,
		NextReview:         doc.NextReview,
		CreatedAt:          doc.CreatedAt,
		UpdatedAt:          doc.UpdatedAt,
	}
}

// Deck operations
func (r *Repository) CreateDeck(deck *entities.Deck) error {
	deck.CreatedAt = time.Now()
	deck.UpdatedAt = time.Now()
	deck.CardCount = 0

	collection := r.db.GetCollection("decks")
	_, err := collection.InsertOne(context.Background(), deck)
	return err
}

func (r *Repository) CreateDeckWithStringUserID(deck *entities.Deck, userID string) error {
	deck.CreatedAt = time.Now()
	deck.UpdatedAt = time.Now()
	deck.CardCount = 0

	// Criar documento com userId como string
	doc := bson.M{
		"userId":      userID,
		"name":        deck.Name,
		"description": deck.Description,
		"tags":        deck.Tags,
		"color":       deck.Color,
		"border":      deck.Border,
		"background":  deck.Background,
		"cardCount":   deck.CardCount,
		"isPublic":    deck.IsPublic,
		"createdAt":   deck.CreatedAt,
		"updatedAt":   deck.UpdatedAt,
	}

	collection := r.db.GetCollection("decks")
	result, err := collection.InsertOne(context.Background(), doc)
	if err != nil {
		return err
	}

	// Atualizar o ID do deck
	deck.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *Repository) GetDeckByID(deckID primitive.ObjectID) (*entities.Deck, error) {
	collection := r.db.GetCollection("decks")

	var deck entities.Deck
	err := collection.FindOne(context.Background(), bson.M{"_id": deckID}).Decode(&deck)
	if err != nil {
		return nil, err
	}

	return &deck, nil
}

func (r *Repository) GetDecksByUserID(userID primitive.ObjectID) ([]entities.Deck, error) {
	collection := r.db.GetCollection("decks")

	// Converter ObjectID para string para buscar na coleção
	userIDStr := userID.Hex()

	cursor, err := collection.Find(context.Background(), bson.M{"userId": userIDStr})
	if err != nil {
		return []entities.Deck{}, err
	}
	defer cursor.Close(context.Background())

	var decks []entities.Deck
	if err = cursor.All(context.Background(), &decks); err != nil {
		return []entities.Deck{}, err
	}

	// Garantir que sempre retorne um array, mesmo que vazio
	if decks == nil {
		decks = []entities.Deck{}
	}

	return decks, nil
}

func (r *Repository) UpdateDeck(deck *entities.Deck) error {
	deck.UpdatedAt = time.Now()

	collection := r.db.GetCollection("decks")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"_id": deck.ID},
		bson.M{"$set": deck},
	)
	return err
}

func (r *Repository) DeleteDeck(deckID primitive.ObjectID) error {
	collection := r.db.GetCollection("decks")
	_, err := collection.DeleteOne(context.Background(), bson.M{"_id": deckID})
	return err
}

func (r *Repository) CountDecksByUserID(userID primitive.ObjectID) (int64, error) {
	collection := r.db.GetCollection("decks")
	return collection.CountDocuments(context.Background(), bson.M{"userId": userID})
}

// Study session operations
func (r *Repository) CreateStudySession(session *entities.StudySession) error {
	session.StartTime = time.Now()

	collection := r.db.GetCollection("study_sessions")
	_, err := collection.InsertOne(context.Background(), session)
	return err
}

func (r *Repository) UpdateStudySession(session *entities.StudySession) error {
	session.EndTime = time.Now()
	session.Duration = int(session.EndTime.Sub(session.StartTime).Minutes())

	collection := r.db.GetCollection("study_sessions")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"_id": session.ID},
		bson.M{"$set": session},
	)
	return err
}

func (r *Repository) GetStudySessionsByUserID(userID primitive.ObjectID, limit int64) ([]entities.StudySession, error) {
	collection := r.db.GetCollection("study_sessions")

	opts := options.Find().SetLimit(limit).SetSort(bson.M{"start_time": -1})
	cursor, err := collection.Find(context.Background(), bson.M{"user_id": userID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var sessions []entities.StudySession
	if err = cursor.All(context.Background(), &sessions); err != nil {
		return nil, err
	}

	return sessions, nil
}

func (r *Repository) GetDecksByUserEmail(userEmail string) ([]entities.Deck, error) {
	collection := r.db.GetCollection("decks")
	cursor, err := collection.Find(context.Background(), bson.M{"userId": userEmail})
	if err != nil {
		return []entities.Deck{}, err
	}
	defer cursor.Close(context.Background())

	var decks []entities.Deck
	if err = cursor.All(context.Background(), &decks); err != nil {
		return []entities.Deck{}, err
	}
	if decks == nil {
		decks = []entities.Deck{}
	}
	return decks, nil
}

func (r *Repository) CountDecksByUserEmail(userEmail string) (int64, error) {
	collection := r.db.GetCollection("decks")
	return collection.CountDocuments(context.Background(), bson.M{"userId": userEmail})
}

func (r *Repository) CountCardsByDeckIDString(deckID string) (int64, error) {
	collection := r.db.GetCollection("cards")
	return collection.CountDocuments(context.Background(), bson.M{"deckId": deckID})
}

// Flashcard operations
func (r *Repository) CreateFlashcard(card *entities.Flashcard) error {
	// Converter a entidade para o formato do documento
	doc := CardDocument{
		DeckID:      card.DeckID,
		Question:    card.Question,
		Answer:      card.Answer,
		ImageURL:    card.ImageURL,
		AudioURL:    card.AudioURL,
		Tags:        card.Tags,
		Difficulty:  card.Difficulty,
		ReviewCount: 0,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	collection := r.db.GetCollection("cards")
	result, err := collection.InsertOne(context.Background(), doc)
	if err != nil {
		return fmt.Errorf("failed to insert card: %v", err)
	}

	card.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *Repository) GetFlashcardsByDeckID(deckID primitive.ObjectID) ([]entities.Flashcard, error) {
	collection := r.db.GetCollection("cards")

	cursor, err := collection.Find(context.Background(), bson.M{"deckId": deckID})
	if err != nil {
		return []entities.Flashcard{}, err
	}
	defer cursor.Close(context.Background())

	var cards []entities.Flashcard
	if err = cursor.All(context.Background(), &cards); err != nil {
		return []entities.Flashcard{}, err
	}

	if cards == nil {
		cards = []entities.Flashcard{}
	}

	return cards, nil
}

func (r *Repository) CountCardsByDeckID(deckID primitive.ObjectID) (int64, error) {
	collection := r.db.GetCollection("cards")
	return collection.CountDocuments(context.Background(), bson.M{"deckId": deckID})
}

func (r *MongoRepository) CountCardsByDeckID(deckID primitive.ObjectID) (int64, error) {
	return r.collection.CountDocuments(context.Background(), bson.M{"deckId": deckID})
}

func (r *MongoRepository) CountCardsByDeckIDString(deckID string) (int64, error) {
	return r.collection.CountDocuments(context.Background(), bson.M{"deckId": deckID})
}

func (r *MongoRepository) GetFlashcardsByDeckID(deckID primitive.ObjectID) ([]entities.Flashcard, error) {
	cursor, err := r.collection.Find(context.Background(), bson.M{"deckId": deckID})
	if err != nil {
		return []entities.Flashcard{}, err
	}
	defer cursor.Close(context.Background())

	var cards []entities.Flashcard
	if err = cursor.All(context.Background(), &cards); err != nil {
		return []entities.Flashcard{}, err
	}

	if cards == nil {
		cards = []entities.Flashcard{}
	}

	return cards, nil
}

func (r *MongoRepository) GetFlashcardsByDeckIDString(deckID string) ([]entities.Flashcard, error) {
	cursor, err := r.collection.Find(context.Background(), bson.M{"deckId": deckID})
	if err != nil {
		return []entities.Flashcard{}, err
	}
	defer cursor.Close(context.Background())

	var cards []entities.Flashcard
	if err = cursor.All(context.Background(), &cards); err != nil {
		return []entities.Flashcard{}, err
	}

	if cards == nil {
		cards = []entities.Flashcard{}
	}

	return cards, nil
}

func (r *MongoRepository) CreateFlashcard(card *entities.Flashcard) error {
	return r.Create(context.Background(), card)
}

// Deck operations for MongoRepository
func (r *MongoRepository) CreateDeck(deck *entities.Deck) error {
	deck.CreatedAt = time.Now()
	deck.UpdatedAt = time.Now()
	deck.CardCount = 0

	collection := r.db.GetCollection("decks")
	_, err := collection.InsertOne(context.Background(), deck)
	return err
}

func (r *MongoRepository) CreateDeckWithStringUserID(deck *entities.Deck, userID string) error {
	deck.CreatedAt = time.Now()
	deck.UpdatedAt = time.Now()
	deck.CardCount = 0

	// Criar documento com userId como string
	doc := bson.M{
		"userId":      userID,
		"name":        deck.Name,
		"description": deck.Description,
		"tags":        deck.Tags,
		"color":       deck.Color,
		"border":      deck.Border,
		"background":  deck.Background,
		"cardCount":   deck.CardCount,
		"isPublic":    deck.IsPublic,
		"createdAt":   deck.CreatedAt,
		"updatedAt":   deck.UpdatedAt,
	}

	collection := r.db.GetCollection("decks")
	result, err := collection.InsertOne(context.Background(), doc)
	if err != nil {
		return err
	}

	// Atualizar o ID do deck
	deck.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *MongoRepository) GetDeckByID(deckID primitive.ObjectID) (*entities.Deck, error) {
	collection := r.db.GetCollection("decks")

	var deck entities.Deck
	err := collection.FindOne(context.Background(), bson.M{"_id": deckID}).Decode(&deck)
	if err != nil {
		return nil, err
	}

	return &deck, nil
}

func (r *MongoRepository) GetDecksByUserID(userID primitive.ObjectID) ([]entities.Deck, error) {
	collection := r.db.GetCollection("decks")

	// Converter ObjectID para string para buscar na coleção
	userIDStr := userID.Hex()

	cursor, err := collection.Find(context.Background(), bson.M{"userId": userIDStr})
	if err != nil {
		return []entities.Deck{}, err
	}
	defer cursor.Close(context.Background())

	var decks []entities.Deck
	if err = cursor.All(context.Background(), &decks); err != nil {
		return []entities.Deck{}, err
	}

	// Garantir que sempre retorne um array, mesmo que vazio
	if decks == nil {
		decks = []entities.Deck{}
	}

	return decks, nil
}

func (r *MongoRepository) UpdateDeck(deck *entities.Deck) error {
	deck.UpdatedAt = time.Now()

	collection := r.db.GetCollection("decks")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"_id": deck.ID},
		bson.M{"$set": deck},
	)
	return err
}

func (r *MongoRepository) DeleteDeck(deckID primitive.ObjectID) error {
	collection := r.db.GetCollection("decks")
	_, err := collection.DeleteOne(context.Background(), bson.M{"_id": deckID})
	return err
}

func (r *MongoRepository) CountDecksByUserID(userID primitive.ObjectID) (int64, error) {
	collection := r.db.GetCollection("decks")
	return collection.CountDocuments(context.Background(), bson.M{"userId": userID})
}

func (r *MongoRepository) GetDecksByUserEmail(userEmail string) ([]entities.Deck, error) {
	collection := r.db.GetCollection("decks")
	cursor, err := collection.Find(context.Background(), bson.M{"userId": userEmail})
	if err != nil {
		return []entities.Deck{}, err
	}
	defer cursor.Close(context.Background())

	var decks []entities.Deck
	if err = cursor.All(context.Background(), &decks); err != nil {
		return []entities.Deck{}, err
	}
	if decks == nil {
		decks = []entities.Deck{}
	}
	return decks, nil
}

func (r *MongoRepository) CountPublicDecksByUserEmail(userEmail string) (int64, error) {
	collection := r.db.GetCollection("decks")
	filter := bson.M{"userId": userEmail, "isPublic": true}
	return collection.CountDocuments(context.Background(), filter)
}

func (r *MongoRepository) CountPrivateDecksByUserEmail(userEmail string) (int64, error) {
	collection := r.db.GetCollection("decks")
	filter := bson.M{"userId": userEmail, "isPublic": false}
	return collection.CountDocuments(context.Background(), filter)
}

// Study session operations for MongoRepository
func (r *MongoRepository) CreateStudySession(session *entities.StudySession) error {
	session.StartTime = time.Now()

	collection := r.db.GetCollection("study_sessions")
	_, err := collection.InsertOne(context.Background(), session)
	return err
}

func (r *MongoRepository) UpdateStudySession(session *entities.StudySession) error {
	session.EndTime = time.Now()
	session.Duration = int(session.EndTime.Sub(session.StartTime).Minutes())

	collection := r.db.GetCollection("study_sessions")
	_, err := collection.UpdateOne(
		context.Background(),
		bson.M{"_id": session.ID},
		bson.M{"$set": session},
	)
	return err
}

func (r *MongoRepository) GetStudySessionsByUserID(userID primitive.ObjectID, limit int64) ([]entities.StudySession, error) {
	collection := r.db.GetCollection("study_sessions")

	opts := options.Find().SetLimit(limit).SetSort(bson.M{"start_time": -1})
	cursor, err := collection.Find(context.Background(), bson.M{"user_id": userID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var sessions []entities.StudySession
	if err = cursor.All(context.Background(), &sessions); err != nil {
		return nil, err
	}

	return sessions, nil
}

// Novo: Listagem de decks por userID (ObjectID) com filtro
func (r *MongoRepository) GetDecksByUserIDWithFilter(userID primitive.ObjectID, visibility, search string) ([]entities.Deck, error) {
	collection := r.db.GetCollection("decks")
	userIDStr := userID.Hex()

	filter := bson.M{"userId": userIDStr}

	// Filtro de visibilidade
	if visibility == "public" {
		filter["isPublic"] = true
	} else if visibility == "private" {
		filter["isPublic"] = false
	}

	// Filtro de busca
	if search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": search, "$options": "i"}},
			{"tags": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		return []entities.Deck{}, err
	}
	defer cursor.Close(context.Background())

	var decks []entities.Deck
	if err = cursor.All(context.Background(), &decks); err != nil {
		return []entities.Deck{}, err
	}
	if decks == nil {
		decks = []entities.Deck{}
	}
	return decks, nil
}

// Novo: Listagem de decks por userEmail (string) com filtro
func (r *MongoRepository) GetDecksByUserEmailWithFilter(userEmail, visibility, search string) ([]entities.Deck, error) {
	collection := r.db.GetCollection("decks")
	filter := bson.M{"userId": userEmail}

	if visibility == "public" {
		filter["isPublic"] = true
	} else if visibility == "private" {
		filter["isPublic"] = false
	}

	if search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": search, "$options": "i"}},
			{"tags": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		return []entities.Deck{}, err
	}
	defer cursor.Close(context.Background())

	var decks []entities.Deck
	if err = cursor.All(context.Background(), &decks); err != nil {
		return []entities.Deck{}, err
	}
	if decks == nil {
		decks = []entities.Deck{}
	}
	return decks, nil
}
