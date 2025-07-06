package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoDB connection
var mongoClient *mongo.Client
var mongoDB *mongo.Database

// Initialize MongoDB connection
func initMongoDB() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get MongoDB URI from environment variable or use default
	mongoURI := "mongodb://localhost:27017"
	if envURI := os.Getenv("MONGODB_URI"); envURI != "" {
		mongoURI = envURI
	}

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %v", err)
	}

	// Ping the database
	if err := client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("failed to ping MongoDB: %v", err)
	}

	mongoClient = client
	mongoDB = client.Database("flashcard_db")

	log.Printf("Connected to MongoDB successfully at %s", mongoURI)
	return nil
}

// Mock data structures
type User struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Plan      string `json:"plan"` // "free" or "premium"
	CreatedAt string `json:"createdAt"`
}

type Deck struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	UserID      string `json:"userId"`
	CardCount   int    `json:"cardCount"`
	IsPublic    bool   `json:"isPublic"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

type Card struct {
	ID         string   `json:"id"`
	DeckID     string   `json:"deckId"`
	Question   string   `json:"question"`
	Answer     string   `json:"answer"`
	ImageURL   *string  `json:"imageUrl,omitempty"`
	AudioURL   *string  `json:"audioUrl,omitempty"`
	Tags       []string `json:"tags,omitempty"`
	Difficulty int      `json:"difficulty"`
	CreatedAt  string   `json:"createdAt"`
	UpdatedAt  string   `json:"updatedAt"`
}

type Plan struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Price       float64  `json:"price"`
	Features    []string `json:"features"`
	Limits      Limits   `json:"limits"`
}

type Limits struct {
	MaxDecks         int `json:"maxDecks"`
	MaxCardsPerDeck  int `json:"maxCardsPerDeck"`
	MaxStudySessions int `json:"maxStudySessions"`
}

type UsageStats struct {
	UserID           string `json:"userId"`
	TotalDecks       int    `json:"totalDecks"`
	TotalCards       int    `json:"totalCards"`
	StudySessions    int    `json:"studySessions"`
	LastStudySession string `json:"lastStudySession"`
}

// Mock data
var users = map[string]User{
	"1": {
		ID:        "1",
		Email:     "user@example.com",
		Name:      "Usuário Teste",
		Plan:      "free",
		CreatedAt: "2024-01-01T00:00:00Z",
	},
}

var decks = map[string]Deck{
	"1": {
		ID:          "1",
		Name:        "Matemática Básica",
		Description: "Conceitos fundamentais de matemática",
		UserID:      "1",
		CardCount:   5,
		IsPublic:    true,
		CreatedAt:   "2024-01-01T00:00:00Z",
		UpdatedAt:   "2024-01-01T00:00:00Z",
	},
	"2": {
		ID:          "2",
		Name:        "História do Brasil",
		Description: "Fatos importantes da história brasileira",
		UserID:      "1",
		CardCount:   3,
		IsPublic:    true,
		CreatedAt:   "2024-01-01T00:00:00Z",
		UpdatedAt:   "2024-01-01T00:00:00Z",
	},
}

var cards = map[string]Card{
	"1": {
		ID:         "1",
		DeckID:     "1",
		Question:   "Quanto é 2 + 2?",
		Answer:     "4",
		Difficulty: 1,
		Tags:       []string{"matemática", "adição"},
		CreatedAt:  "2024-01-01T00:00:00Z",
		UpdatedAt:  "2024-01-01T00:00:00Z",
	},
	"2": {
		ID:         "2",
		DeckID:     "1",
		Question:   "Quanto é 5 x 5?",
		Answer:     "25",
		Difficulty: 2,
		Tags:       []string{"matemática", "multiplicação"},
		CreatedAt:  "2024-01-01T00:00:00Z",
		UpdatedAt:  "2024-01-01T00:00:00Z",
	},
	"3": {
		ID:         "3",
		DeckID:     "1",
		Question:   "Qual é a raiz quadrada de 16?",
		Answer:     "4",
		Difficulty: 2,
		Tags:       []string{"matemática", "raiz quadrada"},
		CreatedAt:  "2024-01-01T00:00:00Z",
		UpdatedAt:  "2024-01-01T00:00:00Z",
	},
	"4": {
		ID:         "4",
		DeckID:     "2",
		Question:   "Em que ano o Brasil foi descoberto?",
		Answer:     "1500",
		Difficulty: 1,
		Tags:       []string{"história", "descobrimento"},
		CreatedAt:  "2024-01-01T00:00:00Z",
		UpdatedAt:  "2024-01-01T00:00:00Z",
	},
	"5": {
		ID:         "5",
		DeckID:     "2",
		Question:   "Quem proclamou a independência do Brasil?",
		Answer:     "Dom Pedro I",
		Difficulty: 1,
		Tags:       []string{"história", "independência"},
		CreatedAt:  "2024-01-01T00:00:00Z",
		UpdatedAt:  "2024-01-01T00:00:00Z",
	},
}

var plans = map[string]Plan{
	"free": {
		ID:          "free",
		Name:        "Gratuito",
		Description: "Plano básico com recursos limitados",
		Price:       0.0,
		Features: []string{
			"Até 3 decks",
			"Até 10 cards por deck",
			"Estudo básico",
			"Estatísticas simples",
		},
		Limits: Limits{
			MaxDecks:         3,
			MaxCardsPerDeck:  10,
			MaxStudySessions: 5,
		},
	},
	"premium": {
		ID:          "premium",
		Name:        "Premium",
		Description: "Plano completo com recursos avançados",
		Price:       9.99,
		Features: []string{
			"Decks ilimitados",
			"Cards ilimitados",
			"Animações especiais",
			"Estatísticas avançadas",
			"Exportação de dados",
			"Notificações personalizadas",
		},
		Limits: Limits{
			MaxDecks:         -1, // Ilimitado
			MaxCardsPerDeck:  -1, // Ilimitado
			MaxStudySessions: -1, // Ilimitado
		},
	},
}

var usageStats = map[string]UsageStats{
	"1": {
		UserID:           "1",
		TotalDecks:       2,
		TotalCards:       5,
		StudySessions:    3,
		LastStudySession: "2024-01-01T00:00:00Z",
	},
}

// Helper functions for limit checking
func getUserPlan(userID string) string {
	if user, exists := users[userID]; exists {
		return user.Plan
	}
	return "free" // Default to free plan
}

func getPlanLimits(planName string) Limits {
	if plan, exists := plans[planName]; exists {
		return plan.Limits
	}
	return plans["free"].Limits // Default to free plan limits
}

func checkDeckLimit(userID string) (bool, string) {
	plan := getUserPlan(userID)
	limits := getPlanLimits(plan)

	if limits.MaxDecks == -1 {
		return true, "" // Unlimited
	}

	stats, exists := usageStats[userID]
	if !exists {
		return true, "" // No stats yet, allow creation
	}

	if stats.TotalDecks >= limits.MaxDecks {
		return false, fmt.Sprintf("Limite de %d decks atingido. Faça upgrade para Premium.", limits.MaxDecks)
	}

	return true, ""
}

func checkCardLimit(userID string, deckID string) (bool, string) {
	plan := getUserPlan(userID)
	limits := getPlanLimits(plan)

	if limits.MaxCardsPerDeck == -1 {
		return true, "" // Unlimited
	}

	// Count cards in the deck
	cardCount := 0
	for _, card := range cards {
		if card.DeckID == deckID {
			cardCount++
		}
	}

	if cardCount >= limits.MaxCardsPerDeck {
		return false, fmt.Sprintf("Limite de %d cards por deck atingido. Faça upgrade para Premium.", limits.MaxCardsPerDeck)
	}

	return true, ""
}

func updateUsageStats(userID string, deckID string, isNewDeck bool, isNewCard bool) {
	stats, exists := usageStats[userID]
	if !exists {
		stats = UsageStats{
			UserID: userID,
		}
	}

	if isNewDeck {
		stats.TotalDecks++
	}

	if isNewCard {
		stats.TotalCards++
	}

	stats.LastStudySession = time.Now().Format(time.RFC3339)
	usageStats[userID] = stats
}

// HTTP handlers
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
		"time":   time.Now().Format(time.RFC3339),
	})
}

func getDecksHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "1" // Default user for demo
	}

	userDecks := []Deck{}
	for _, deck := range decks {
		if deck.UserID == userID {
			userDecks = append(userDecks, deck)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userDecks)
}

func createDeckHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "1" // Default user for demo
	}

	// Check deck limit
	canCreate, message := checkDeckLimit(userID)
	if !canCreate {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": message,
		})
		return
	}

	var deckData struct {
		Name        string   `json:"name"`
		Description string   `json:"description"`
		Tags        []string `json:"tags"`
	}

	if err := json.NewDecoder(r.Body).Decode(&deckData); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	// Create new deck
	newID := strconv.Itoa(len(decks) + 1)
	newDeck := Deck{
		ID:          newID,
		Name:        deckData.Name,
		Description: deckData.Description,
		UserID:      userID,
		CardCount:   0,
		IsPublic:    true,
		CreatedAt:   time.Now().Format(time.RFC3339),
		UpdatedAt:   time.Now().Format(time.RFC3339),
	}

	decks[newID] = newDeck
	updateUsageStats(userID, newID, true, false)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newDeck)
}

func getCardsHandler(c *gin.Context) {
	deckID := c.Query("deckId")
	if deckID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "deckId is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := mongoDB.Collection("cards")

	cursor, err := collection.Find(ctx, bson.M{"deckId": deckID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cards"})
		return
	}
	defer cursor.Close(ctx)

	var cards []bson.M
	if err = cursor.All(ctx, &cards); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode cards"})
		return
	}

	// Convert BSON to JSON format
	var result []map[string]interface{}
	for _, card := range cards {
		// Convert ObjectId to string
		if id, ok := card["_id"].(primitive.ObjectID); ok {
			card["id"] = id.Hex()
			delete(card, "_id")
		} else if id, ok := card["_id"].(string); ok {
			card["id"] = id
			delete(card, "_id")
		}
		result = append(result, card)
	}

	c.JSON(http.StatusOK, result)
}

func createCardHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "1" // Default user for demo
	}

	var cardData struct {
		DeckID     string   `json:"deckId"`
		Question   string   `json:"question"`
		Answer     string   `json:"answer"`
		ImageURL   *string  `json:"imageUrl"`
		AudioURL   *string  `json:"audioUrl"`
		Tags       []string `json:"tags"`
		Difficulty int      `json:"difficulty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&cardData); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	// Check card limit
	canCreate, message := checkCardLimit(userID, cardData.DeckID)
	if !canCreate {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": message,
		})
		return
	}

	// Create new card
	newID := strconv.Itoa(len(cards) + 1)
	newCard := Card{
		ID:         newID,
		DeckID:     cardData.DeckID,
		Question:   cardData.Question,
		Answer:     cardData.Answer,
		ImageURL:   cardData.ImageURL,
		AudioURL:   cardData.AudioURL,
		Tags:       cardData.Tags,
		Difficulty: cardData.Difficulty,
		CreatedAt:  time.Now().Format(time.RFC3339),
		UpdatedAt:  time.Now().Format(time.RFC3339),
	}

	cards[newID] = newCard

	// Update deck card count
	if deck, exists := decks[cardData.DeckID]; exists {
		deck.CardCount++
		deck.UpdatedAt = time.Now().Format(time.RFC3339)
		decks[cardData.DeckID] = deck
	}

	updateUsageStats(userID, cardData.DeckID, false, true)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newCard)
}

func getPlansHandler(w http.ResponseWriter, r *http.Request) {
	plansList := []Plan{}
	for _, plan := range plans {
		plansList = append(plansList, plan)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(plansList)
}

func getUserUsageHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "1" // Default user for demo
	}

	stats, exists := usageStats[userID]
	if !exists {
		stats = UsageStats{
			UserID: userID,
		}
	}

	plan := getUserPlan(userID)
	limits := getPlanLimits(plan)

	response := map[string]interface{}{
		"stats":  stats,
		"plan":   plan,
		"limits": limits,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func authURLsHandler(w http.ResponseWriter, r *http.Request) {
	urls := map[string]string{
		"google":   "https://accounts.google.com/oauth/authorize?client_id=your-google-client-id&redirect_uri=your-redirect-uri&scope=email profile&response_type=code",
		"linkedin": "https://www.linkedin.com/oauth/v2/authorization?client_id=your-linkedin-client-id&redirect_uri=your-redirect-uri&scope=r_liteprofile r_emailaddress&response_type=code",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(urls)
}

func googleAuth(c *gin.Context) {
	// Mock Google OAuth
	user := gin.H{
		"id":     "user1",
		"name":   "João Silva",
		"email":  "joao@gmail.com",
		"avatar": "https://example.com/avatar.jpg",
		"plan":   "free",
		"xp":     1250,
		"level":  5,
		"streak": 7,
	}

	result := gin.H{
		"user":  user,
		"token": "mock_google_token_12345",
	}

	c.JSON(200, result)
}

func linkedinAuth(c *gin.Context) {
	// Mock LinkedIn OAuth
	user := gin.H{
		"id":     "user1",
		"name":   "João Silva",
		"email":  "joao@linkedin.com",
		"avatar": "https://example.com/avatar.jpg",
		"plan":   "free",
		"xp":     1250,
		"level":  5,
		"streak": 7,
	}

	result := gin.H{
		"user":  user,
		"token": "mock_linkedin_token_12345",
	}

	c.JSON(200, result)
}

func main() {
	// Initialize MongoDB
	if err := initMongoDB(); err != nil {
		log.Fatalf("Failed to initialize MongoDB: %v", err)
	}
	defer func() {
		if err := mongoClient.Disconnect(context.Background()); err != nil {
			log.Printf("Failed to disconnect from MongoDB: %v", err)
		}
	}()

	r := gin.Default()

	// CORS configuration
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "timestamp": time.Now()})
	})

	// API routes
	api := r.Group("/api")
	{
		// Decks
		api.GET("/decks", getDecks)
		api.POST("/decks", createDeck)
		api.GET("/decks/:id", getDeck)
		api.PUT("/decks/:id", updateDeck)
		api.DELETE("/decks/:id", deleteDeck)
		api.GET("/decks/public", getPublicDecks)
		api.POST("/decks/:id/share", generateShareLink)
		api.POST("/decks/import", importDeck)

		// Cards
		api.GET("/cards", getCards)
		api.POST("/cards", createCard)
		api.PUT("/cards/:id", updateCard)
		api.DELETE("/cards/:id", deleteCard)
		api.POST("/cards/:id/review", recordCardReview)

		// Study sessions
		api.POST("/study-sessions", recordStudySession)
		api.GET("/study-sessions", getStudySessions)

		// Gamification
		api.GET("/gamification/stats", getUserStats)
		api.GET("/gamification/badges", getBadges)
		api.GET("/gamification/achievements", getAchievements)
		api.GET("/gamification/leaderboard", getLeaderboard)
		api.POST("/gamification/study-session", recordGamificationStudySession)
		api.POST("/gamification/card-created", recordCardCreation)
		api.POST("/gamification/deck-shared", recordDeckShared)
		api.POST("/gamification/daily-reward", claimDailyReward)
		api.GET("/gamification/daily-reward/status", getDailyRewardStatus)
		api.GET("/gamification/weekly-challenges", getWeeklyChallenges)
		api.GET("/gamification/seasonal-events", getSeasonalEvents)
		api.GET("/gamification/friends-leaderboard", getFriendsLeaderboard)
		api.POST("/gamification/challenge-friend", challengeFriend)
		api.POST("/gamification/challenges/:id/accept", acceptChallenge)
		api.GET("/gamification/active-challenges", getActiveChallenges)
		api.GET("/gamification/badges/:id/progress", getBadgeProgress)
		api.GET("/gamification/achievements/:id/progress", getAchievementProgress)
		api.POST("/gamification/achievements/:id/share", shareAchievement)
		api.GET("/gamification/history", getGamificationHistory)

		// Notifications
		api.GET("/notifications", getNotifications)
		api.POST("/notifications/register-token", registerPushToken)
		api.POST("/notifications/send", sendNotification)
		api.POST("/notifications/send-all", sendNotificationToAll)
		api.GET("/notifications/history", getNotificationHistory)
		api.PUT("/notifications/:id/read", markNotificationAsRead)
		api.PUT("/notifications/preferences", updateNotificationPreferences)

		// Stats
		api.GET("/stats/study", getStudyStats)
		api.GET("/stats/decks", getDeckStats)
		api.GET("/stats/progress", getProgressStats)
		api.GET("/stats/export", exportData)
	}

	// Auth routes
	auth := r.Group("/auth")
	{
		auth.GET("/urls", getAuthURLs)
		auth.GET("/google", googleAuth)
		auth.GET("/linkedin", linkedinAuth)
	}

	fmt.Println("🚀 Flashcard API Server starting on http://localhost:3000")
	fmt.Println("📚 Available endpoints:")
	fmt.Println("   GET  /health")
	fmt.Println("   GET  /api/decks")
	fmt.Println("   POST /api/decks")
	fmt.Println("   GET  /api/cards?deckId=1")
	fmt.Println("   POST /api/cards")
	fmt.Println("   GET  /api/plans")
	fmt.Println("   GET  /api/usage")
	fmt.Println("   GET  /auth/urls")
	fmt.Println("   GET  /auth/google")
	fmt.Println("   GET  /auth/linkedin")

	log.Fatal(r.Run(":3000"))
}

// Mock data structures
type MockDeck struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	UserID      string    `json:"userId"`
	CardCount   int       `json:"cardCount"`
	IsPublic    bool      `json:"isPublic"`
	ShareCode   string    `json:"shareCode,omitempty"`
	Tags        []string  `json:"tags,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type MockCard struct {
	ID                 string     `json:"id"`
	DeckID             string     `json:"deckId"`
	Question           string     `json:"question"`
	Answer             string     `json:"answer"`
	Alternatives       []string   `json:"alternatives,omitempty"`
	CorrectAlternative *int       `json:"correctAlternative,omitempty"`
	ImageURL           *string    `json:"imageUrl,omitempty"`
	AudioURL           *string    `json:"audioUrl,omitempty"`
	Tags               []string   `json:"tags"`
	Difficulty         int        `json:"difficulty"`
	ReviewCount        int        `json:"reviewCount"`
	LastReviewed       *time.Time `json:"lastReviewed,omitempty"`
	NextReview         *time.Time `json:"nextReview,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

type StudySession struct {
	ID             string    `json:"id"`
	UserID         string    `json:"userId"`
	DeckID         string    `json:"deckId"`
	CardsReviewed  int       `json:"cardsReviewed"`
	CorrectAnswers int       `json:"correctAnswers"`
	TimeSpent      int       `json:"timeSpent"`
	StreakBonus    int       `json:"streakBonus"`
	XP             int       `json:"xp"`
	CreatedAt      time.Time `json:"createdAt"`
}

type Badge struct {
	ID           string             `json:"id"`
	Name         string             `json:"name"`
	Description  string             `json:"description"`
	Icon         string             `json:"icon"`
	Category     string             `json:"category"`
	Rarity       string             `json:"rarity"`
	Requirements []BadgeRequirement `json:"requirements"`
	XPReward     int                `json:"xpReward"`
	UnlockedAt   *time.Time         `json:"unlockedAt,omitempty"`
}

type BadgeRequirement struct {
	Type      string `json:"type"`
	Value     int    `json:"value"`
	Timeframe string `json:"timeframe,omitempty"`
}

type Achievement struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Icon        string     `json:"icon"`
	Category    string     `json:"category"`
	Progress    int        `json:"progress"`
	MaxProgress int        `json:"maxProgress"`
	Completed   bool       `json:"completed"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
	XPReward    int        `json:"xpReward"`
}

type UserStats struct {
	TotalXP            int           `json:"totalXP"`
	Level              int           `json:"level"`
	CurrentLevelXP     int           `json:"currentLevelXP"`
	NextLevelXP        int           `json:"nextLevelXP"`
	StudyStreak        int           `json:"studyStreak"`
	LongestStreak      int           `json:"longestStreak"`
	TotalCardsCreated  int           `json:"totalCardsCreated"`
	TotalCardsReviewed int           `json:"totalCardsReviewed"`
	TotalStudySessions int           `json:"totalStudySessions"`
	PerfectScores      int           `json:"perfectScores"`
	Badges             []Badge       `json:"badges"`
	Achievements       []Achievement `json:"achievements"`
	Rank               int           `json:"rank"`
	TotalUsers         int           `json:"totalUsers"`
}

// Mock data
var mockDecks = []MockDeck{
	{ID: "1", Name: "Anatomia Humana", Description: "Conceitos básicos de anatomia", UserID: "user1", CardCount: 15, IsPublic: true, CreatedAt: time.Now().AddDate(0, 0, -5), UpdatedAt: time.Now()},
	{ID: "2", Name: "História do Brasil", Description: "Fatos históricos importantes", UserID: "user1", CardCount: 20, IsPublic: false, CreatedAt: time.Now().AddDate(0, 0, -3), UpdatedAt: time.Now()},
	{ID: "3", Name: "Matemática Básica", Description: "Operações fundamentais", UserID: "user1", CardCount: 10, IsPublic: true, CreatedAt: time.Now().AddDate(0, 0, -1), UpdatedAt: time.Now()},
}

var mockCards = []MockCard{
	{ID: "1", DeckID: "1", Question: "Qual é o maior órgão do corpo humano?", Answer: "A pele", Difficulty: 1, ReviewCount: 5, CreatedAt: time.Now().AddDate(0, 0, -5), UpdatedAt: time.Now()},
	{ID: "2", DeckID: "1", Question: "Quantos ossos tem o corpo humano?", Answer: "206 ossos", Difficulty: 2, ReviewCount: 3, CreatedAt: time.Now().AddDate(0, 0, -4), UpdatedAt: time.Now()},
	{ID: "3", DeckID: "2", Question: "Em que ano o Brasil foi descoberto?", Answer: "1500", Difficulty: 1, ReviewCount: 8, CreatedAt: time.Now().AddDate(0, 0, -3), UpdatedAt: time.Now()},
}

var mockBadges = []Badge{
	{ID: "1", Name: "Primeiro Passo", Description: "Criou seu primeiro card", Icon: "🎯", Category: "achievement", Rarity: "common", XPReward: 10},
	{ID: "2", Name: "Estudioso", Description: "Revisou 100 cards", Icon: "📚", Category: "study", Rarity: "rare", XPReward: 50},
	{ID: "3", Name: "Mestre", Description: "Alcançou 1000 XP", Icon: "👑", Category: "special", Rarity: "epic", XPReward: 100},
}

var mockAchievements = []Achievement{
	{ID: "1", Name: "Iniciante", Description: "Complete 10 cards", Icon: "🌟", Category: "milestone", Progress: 8, MaxProgress: 10, Completed: false, XPReward: 25},
	{ID: "2", Name: "Consistente", Description: "Estude por 7 dias seguidos", Icon: "🔥", Category: "challenge", Progress: 5, MaxProgress: 7, Completed: false, XPReward: 75},
}

// Handler functions
func getDecks(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := mongoDB.Collection("decks")

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch decks"})
		return
	}
	defer cursor.Close(ctx)

	var decks []bson.M
	if err = cursor.All(ctx, &decks); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode decks"})
		return
	}

	// Convert BSON to JSON format
	var result []map[string]interface{}
	for _, deck := range decks {
		// Convert ObjectId to string
		if id, ok := deck["_id"].(primitive.ObjectID); ok {
			deck["id"] = id.Hex()
			delete(deck, "_id")
		} else if id, ok := deck["_id"].(string); ok {
			deck["id"] = id
			delete(deck, "_id")
		}
		result = append(result, deck)
	}

	c.JSON(http.StatusOK, result)
}

func createDeck(c *gin.Context) {
	var deck MockDeck
	if err := c.ShouldBindJSON(&deck); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Verificar limite de decks (3 para plano gratuito)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := mongoDB.Collection("decks")

	// Contar apenas os decks do usuário atual
	userID := "user@example.com" // Mock user ID
	count, err := collection.CountDocuments(ctx, bson.M{"userId": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check deck limit"})
		return
	}

	if count >= 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deck limit reached for free plan. Upgrade to premium to create more decks."})
		return
	}

	// Criar deck no MongoDB
	deck.ID = primitive.NewObjectID().Hex()
	deck.UserID = userID
	deck.CreatedAt = time.Now()
	deck.UpdatedAt = time.Now()
	deck.CardCount = 0
	deck.IsPublic = false

	// Converter para BSON
	deckDoc := bson.M{
		"_id":         deck.ID,
		"name":        deck.Name,
		"description": deck.Description,
		"userId":      deck.UserID,
		"cardCount":   deck.CardCount,
		"isPublic":    deck.IsPublic,
		"tags":        deck.Tags,
		"createdAt":   deck.CreatedAt,
		"updatedAt":   deck.UpdatedAt,
	}

	_, err = collection.InsertOne(ctx, deckDoc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create deck"})
		return
	}

	c.JSON(201, deck)
}

func getDeck(c *gin.Context) {
	id := c.Param("id")
	for _, deck := range mockDecks {
		if deck.ID == id {
			c.JSON(200, deck)
			return
		}
	}
	c.JSON(404, gin.H{"error": "Deck not found"})
}

func updateDeck(c *gin.Context) {
	id := c.Param("id")
	var updateData MockDeck
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	for i, deck := range mockDecks {
		if deck.ID == id {
			mockDecks[i].Name = updateData.Name
			mockDecks[i].Description = updateData.Description
			mockDecks[i].UpdatedAt = time.Now()
			c.JSON(200, mockDecks[i])
			return
		}
	}
	c.JSON(404, gin.H{"error": "Deck not found"})
}

func deleteDeck(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deck ID is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := mongoDB.Collection("decks")

	// Primeiro, verificar se o deck existe
	var deck bson.M
	err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&deck)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Deck not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find deck"})
		return
	}

	// Deletar o deck
	_, err = collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete deck"})
		return
	}

	// Deletar todos os cards do deck
	cardsCollection := mongoDB.Collection("cards")
	_, err = cardsCollection.DeleteMany(ctx, bson.M{"deckId": id})
	if err != nil {
		// Log do erro mas não falhar a operação
		fmt.Printf("Warning: Failed to delete cards for deck %s: %v\n", id, err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deck deleted successfully"})
}

func getCards(c *gin.Context) {
	deckID := c.Query("deckId")
	if deckID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "deckId is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := mongoDB.Collection("cards")

	cursor, err := collection.Find(ctx, bson.M{"deckId": deckID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cards"})
		return
	}
	defer cursor.Close(ctx)

	var cards []bson.M
	if err = cursor.All(ctx, &cards); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode cards"})
		return
	}

	// Convert BSON to JSON format
	var result []map[string]interface{}
	for _, card := range cards {
		// Convert ObjectId to string
		if id, ok := card["_id"].(primitive.ObjectID); ok {
			card["id"] = id.Hex()
			delete(card, "_id")
		} else if id, ok := card["_id"].(string); ok {
			card["id"] = id
			delete(card, "_id")
		}
		result = append(result, card)
	}

	c.JSON(http.StatusOK, result)
}

func createCard(c *gin.Context) {
	var card MockCard
	if err := c.ShouldBindJSON(&card); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Gerar ID único para o card
	card.ID = primitive.NewObjectID().Hex()
	card.CreatedAt = time.Now()
	card.UpdatedAt = time.Now()
	card.ReviewCount = 0

	// Salvar card no MongoDB
	collection := mongoDB.Collection("cards")

	cardDoc := bson.M{
		"_id":         card.ID,
		"question":    card.Question,
		"answer":      card.Answer,
		"deckId":      card.DeckID,
		"tags":        card.Tags,
		"difficulty":  card.Difficulty,
		"reviewCount": card.ReviewCount,
		"createdAt":   card.CreatedAt,
		"updatedAt":   card.UpdatedAt,
	}

	_, err := collection.InsertOne(ctx, cardDoc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create card"})
		return
	}

	// Atualizar cardCount do deck
	decksCollection := mongoDB.Collection("decks")
	_, err = decksCollection.UpdateOne(
		ctx,
		bson.M{"_id": card.DeckID},
		bson.M{"$inc": bson.M{"cardCount": 1}},
	)
	if err != nil {
		// Log do erro mas não falhar a operação
		fmt.Printf("Warning: Failed to update deck card count for deck %s: %v\n", card.DeckID, err)
	}

	c.JSON(201, card)
}

func updateCard(c *gin.Context) {
	id := c.Param("id")
	fmt.Printf("updateCard called with id: %s\n", id)

	var updateData MockCard
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := mongoDB.Collection("cards")

	// Primeiro, verificar se o card existe
	var existingCard bson.M
	err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&existingCard)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			fmt.Printf("No document found for ID: %s\n", id)
			c.JSON(http.StatusNotFound, gin.H{"error": "Card not found"})
			return
		}
		fmt.Printf("Error finding card: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find card"})
		return
	}
	fmt.Printf("Found existing card: %+v\n", existingCard)

	// Atualizar o card
	updateDoc := bson.M{
		"$set": bson.M{
			"question":   updateData.Question,
			"answer":     updateData.Answer,
			"tags":       updateData.Tags,
			"difficulty": updateData.Difficulty,
			"updatedAt":  time.Now(),
		},
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": id}, updateDoc)
	if err != nil {
		fmt.Printf("Error updating card: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update card"})
		return
	}

	// Buscar o card atualizado para retornar
	var updatedCard bson.M
	err = collection.FindOne(ctx, bson.M{"_id": id}).Decode(&updatedCard)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated card"})
		return
	}

	// Converter _id para id para manter compatibilidade
	updatedCard["id"] = updatedCard["_id"]
	delete(updatedCard, "_id")

	c.JSON(http.StatusOK, updatedCard)
}

func deleteCard(c *gin.Context) {
	id := c.Param("id")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := mongoDB.Collection("cards")

	// Primeiro, verificar se o card existe e obter o deckId
	var card bson.M
	err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&card)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Card not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find card"})
		return
	}

	// Deletar o card
	_, err = collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete card"})
		return
	}

	// Atualizar cardCount do deck
	if deckID, ok := card["deckId"].(string); ok {
		decksCollection := mongoDB.Collection("decks")
		_, err = decksCollection.UpdateOne(
			ctx,
			bson.M{"_id": deckID},
			bson.M{"$inc": bson.M{"cardCount": -1}},
		)
		if err != nil {
			// Log do erro mas não falhar a operação
			fmt.Printf("Warning: Failed to update deck card count for deck %s: %v\n", deckID, err)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Card deleted successfully"})
}

func recordCardReview(c *gin.Context) {
	id := c.Param("id")
	var reviewData struct {
		IsCorrect bool `json:"isCorrect"`
	}
	if err := c.ShouldBindJSON(&reviewData); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	for i, card := range mockCards {
		if card.ID == id {
			now := time.Now()
			mockCards[i].ReviewCount++
			mockCards[i].LastReviewed = &now

			// Simple spaced repetition: 1, 3, 7, 14, 30 days
			intervals := []int{1, 3, 7, 14, 30}
			intervalIndex := mockCards[i].ReviewCount - 1
			if intervalIndex >= len(intervals) {
				intervalIndex = len(intervals) - 1
			}

			nextReview := now.AddDate(0, 0, intervals[intervalIndex])
			mockCards[i].NextReview = &nextReview
			mockCards[i].UpdatedAt = now

			c.JSON(200, mockCards[i])
			return
		}
	}
	c.JSON(404, gin.H{"error": "Card not found"})
}

func recordStudySession(c *gin.Context) {
	var session StudySession
	if err := c.ShouldBindJSON(&session); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	session.ID = strconv.Itoa(len(mockStudySessions) + 1)
	session.CreatedAt = time.Now()
	session.XP = session.CardsReviewed*5 + session.StreakBonus

	mockStudySessions = append(mockStudySessions, session)
	c.JSON(201, session)
}

func getStudySessions(c *gin.Context) {
	c.JSON(200, mockStudySessions)
}

// Gamification handlers
func getUserStats(c *gin.Context) {
	stats := UserStats{
		TotalXP:            1250,
		Level:              5,
		CurrentLevelXP:     250,
		NextLevelXP:        500,
		StudyStreak:        7,
		LongestStreak:      15,
		TotalCardsCreated:  45,
		TotalCardsReviewed: 120,
		TotalStudySessions: 25,
		PerfectScores:      8,
		Badges:             mockBadges[:2], // First 2 badges
		Achievements:       mockAchievements,
		Rank:               42,
		TotalUsers:         1000,
	}
	c.JSON(200, stats)
}

func getBadges(c *gin.Context) {
	c.JSON(200, mockBadges)
}

func getAchievements(c *gin.Context) {
	c.JSON(200, mockAchievements)
}

func getLeaderboard(c *gin.Context) {
	category := c.DefaultQuery("category", "global")

	leaderboard := []gin.H{
		{"userId": "user1", "username": "João Silva", "score": 2500, "rank": 1, "badges": 8, "achievements": 12, "studyStreak": 30},
		{"userId": "user2", "username": "Maria Santos", "score": 2200, "rank": 2, "badges": 6, "achievements": 10, "studyStreak": 25},
		{"userId": "user3", "username": "Pedro Costa", "score": 2000, "rank": 3, "badges": 5, "achievements": 8, "studyStreak": 20},
	}

	c.JSON(200, gin.H{"category": category, "leaderboard": leaderboard})
}

func recordGamificationStudySession(c *gin.Context) {
	var sessionData struct {
		DeckID         string `json:"deckId"`
		CardsReviewed  int    `json:"cardsReviewed"`
		CorrectAnswers int    `json:"correctAnswers"`
		TimeSpent      int    `json:"timeSpent"`
		StreakBonus    int    `json:"streakBonus"`
	}

	if err := c.ShouldBindJSON(&sessionData); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	xpGained := sessionData.CardsReviewed*5 + sessionData.StreakBonus
	levelUp := false
	newLevel := 0

	// Mock level up logic
	if xpGained > 100 {
		levelUp = true
		newLevel = 6
	}

	response := gin.H{
		"xpGained":        xpGained,
		"newBadges":       []gin.H{},
		"newAchievements": []gin.H{},
		"levelUp":         levelUp,
	}

	if levelUp {
		response["newLevel"] = newLevel
	}

	c.JSON(200, response)
}

func recordCardCreation(c *gin.Context) {
	var data struct {
		DeckID string `json:"deckId"`
	}

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"xpGained":        10,
		"newBadges":       []gin.H{},
		"newAchievements": []gin.H{},
	})
}

func recordDeckShared(c *gin.Context) {
	var data struct {
		DeckID string `json:"deckId"`
	}

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"xpGained":  25,
		"newBadges": []gin.H{},
	})
}

func claimDailyReward(c *gin.Context) {
	c.JSON(200, gin.H{
		"xpGained":    50,
		"streakBonus": 10,
		"newBadges":   []gin.H{},
	})
}

func getDailyRewardStatus(c *gin.Context) {
	c.JSON(200, gin.H{
		"canClaim":      true,
		"nextClaimTime": time.Now().Add(24 * time.Hour).Format(time.RFC3339),
		"currentStreak": 7,
		"streakBonus":   10,
	})
}

func getWeeklyChallenges(c *gin.Context) {
	challenges := []gin.H{
		{
			"id":          "1",
			"name":        "Estudioso da Semana",
			"description": "Complete 50 cards esta semana",
			"progress":    35,
			"maxProgress": 50,
			"xpReward":    100,
			"completed":   false,
		},
		{
			"id":          "2",
			"name":        "Perfeição",
			"description": "Acerte 20 cards consecutivos",
			"progress":    15,
			"maxProgress": 20,
			"xpReward":    75,
			"completed":   false,
		},
	}

	c.JSON(200, gin.H{
		"challenges": challenges,
		"weekNumber": 25,
		"endsAt":     time.Now().AddDate(0, 0, 7).Format(time.RFC3339),
	})
}

func getSeasonalEvents(c *gin.Context) {
	events := []gin.H{
		{
			"id":          "1",
			"name":        "Desafio de Verão",
			"description": "Especial de verão com badges exclusivos",
			"startDate":   time.Now().Format(time.RFC3339),
			"endDate":     time.Now().AddDate(0, 1, 0).Format(time.RFC3339),
			"isActive":    true,
			"specialBadges": []gin.H{
				{"id": "summer1", "name": "Sol de Verão", "icon": "☀️"},
			},
			"specialRewards": []gin.H{
				{"type": "xp", "value": 200},
				{"type": "badge", "value": "summer1"},
			},
		},
	}

	c.JSON(200, events)
}

func getFriendsLeaderboard(c *gin.Context) {
	friends := []gin.H{
		{"userId": "friend1", "username": "Amigo 1", "score": 1800, "rank": 1, "badges": 4, "achievements": 6, "studyStreak": 12},
		{"userId": "friend2", "username": "Amigo 2", "score": 1600, "rank": 2, "badges": 3, "achievements": 5, "studyStreak": 8},
	}

	c.JSON(200, friends)
}

func challengeFriend(c *gin.Context) {
	var data struct {
		FriendID      string `json:"friendId"`
		ChallengeType string `json:"challengeType"`
	}

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"challengeId": "challenge123",
		"expiresAt":   time.Now().AddDate(0, 0, 7).Format(time.RFC3339),
	})
}

func acceptChallenge(c *gin.Context) {
	challengeID := c.Param("id")
	c.JSON(200, gin.H{"message": "Challenge accepted", "challengeId": challengeID})
}

func getActiveChallenges(c *gin.Context) {
	challenges := []gin.H{
		{
			"id":   "challenge123",
			"type": "study_race",
			"challenger": gin.H{
				"id":       "user1",
				"username": "João",
				"avatar":   "avatar1.jpg",
			},
			"challenged": gin.H{
				"id":       "user2",
				"username": "Maria",
				"avatar":   "avatar2.jpg",
			},
			"progress": gin.H{
				"challenger": 15,
				"challenged": 12,
			},
			"expiresAt": time.Now().AddDate(0, 0, 5).Format(time.RFC3339),
		},
	}

	c.JSON(200, challenges)
}

func getBadgeProgress(c *gin.Context) {
	_ = c.Param("id") // badgeID

	c.JSON(200, gin.H{
		"progress":    75,
		"maxProgress": 100,
		"percentage":  75,
		"requirements": []gin.H{
			{"type": "cards_reviewed", "current": 75, "required": 100, "completed": false},
		},
	})
}

func getAchievementProgress(c *gin.Context) {
	_ = c.Param("id") // achievementID

	c.JSON(200, gin.H{
		"progress":      8,
		"maxProgress":   10,
		"percentage":    80,
		"timeRemaining": "2 days",
	})
}

func shareAchievement(c *gin.Context) {
	achievementID := c.Param("id")
	var data struct {
		Platform string `json:"platform"`
	}

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Achievement shared", "achievementId": achievementID, "platform": data.Platform})
}

func getGamificationHistory(c *gin.Context) {
	history := []gin.H{
		{
			"type":        "xp_gained",
			"description": "Ganhou 50 XP estudando",
			"timestamp":   time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			"xpChange":    50,
		},
		{
			"type":        "badge_earned",
			"description": "Conquistou o badge 'Estudioso'",
			"timestamp":   time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
			"badge":       mockBadges[1],
		},
	}

	c.JSON(200, history)
}

// Notification handlers
func getNotifications(c *gin.Context) {
	notifications := []gin.H{
		{
			"id":        "1",
			"title":     "Hora de Estudar!",
			"body":      "Você tem 5 cards para revisar hoje",
			"type":      "study_reminder",
			"isRead":    false,
			"createdAt": time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
		},
		{
			"id":        "2",
			"title":     "Novo Badge!",
			"body":      "Você conquistou o badge 'Primeiro Passo'",
			"type":      "achievement",
			"isRead":    true,
			"createdAt": time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
		},
	}

	c.JSON(200, notifications)
}

func registerPushToken(c *gin.Context) {
	var data struct {
		Token    string `json:"token"`
		Platform string `json:"platform"`
	}

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Token registered successfully"})
}

func sendNotification(c *gin.Context) {
	var data struct {
		UserId       string `json:"userId"`
		Notification struct {
			Title string `json:"title"`
			Body  string `json:"body"`
		} `json:"notification"`
	}

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Notification sent successfully"})
}

func sendNotificationToAll(c *gin.Context) {
	var data struct {
		Notification struct {
			Title string `json:"title"`
			Body  string `json:"body"`
		} `json:"notification"`
	}

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Notification sent to all users"})
}

func getNotificationHistory(c *gin.Context) {
	userId := c.Query("userId")

	history := []gin.H{
		{
			"id":        "1",
			"title":     "Hora de Estudar!",
			"body":      "Você tem 5 cards para revisar hoje",
			"type":      "study_reminder",
			"isRead":    false,
			"createdAt": time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
		},
	}

	c.JSON(200, gin.H{"userId": userId, "history": history})
}

func markNotificationAsRead(c *gin.Context) {
	notificationID := c.Param("id")
	c.JSON(200, gin.H{"message": "Notification marked as read", "notificationId": notificationID})
}

func updateNotificationPreferences(c *gin.Context) {
	var data struct {
		UserId      string `json:"userId"`
		Preferences struct {
			StudyReminders bool `json:"studyReminders"`
			Achievements   bool `json:"achievements"`
			LimitWarnings  bool `json:"limitWarnings"`
			DailyDigest    bool `json:"dailyDigest"`
		} `json:"preferences"`
	}

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Preferences updated successfully"})
}

// Stats handlers
func getStudyStats(c *gin.Context) {
	stats := gin.H{
		"totalStudyTime":     "12h 30m",
		"averageSessionTime": "25m",
		"cardsReviewed":      150,
		"correctAnswers":     120,
		"accuracy":           80.0,
		"studyStreak":        7,
		"longestStreak":      15,
		"weeklyProgress": []gin.H{
			{"day": "Seg", "cards": 10},
			{"day": "Ter", "cards": 15},
			{"day": "Qua", "cards": 8},
			{"day": "Qui", "cards": 20},
			{"day": "Sex", "cards": 12},
			{"day": "Sáb", "cards": 5},
			{"day": "Dom", "cards": 0},
		},
	}

	c.JSON(200, stats)
}

func getDeckStats(c *gin.Context) {
	stats := gin.H{
		"totalDecks":   3,
		"totalCards":   45,
		"averageCards": 15,
		"mostStudied":  "Anatomia Humana",
		"leastStudied": "Matemática Básica",
		"deckProgress": []gin.H{
			{"deck": "Anatomia Humana", "progress": 85, "cards": 15},
			{"deck": "História do Brasil", "progress": 60, "cards": 20},
			{"deck": "Matemática Básica", "progress": 30, "cards": 10},
		},
	}

	c.JSON(200, stats)
}

func getProgressStats(c *gin.Context) {
	stats := gin.H{
		"level":                 5,
		"xp":                    1250,
		"nextLevelXP":           500,
		"progress":              50.0,
		"badgesEarned":          2,
		"achievementsCompleted": 0,
		"rank":                  42,
		"totalUsers":            1000,
		"levelHistory": []gin.H{
			{"level": 1, "date": "2024-01-01"},
			{"level": 2, "date": "2024-01-05"},
			{"level": 3, "date": "2024-01-10"},
			{"level": 4, "date": "2024-01-15"},
			{"level": 5, "date": "2024-01-20"},
		},
	}

	c.JSON(200, stats)
}

func exportData(c *gin.Context) {
	exportData := gin.H{
		"user": gin.H{
			"id":    "user1",
			"name":  "João Silva",
			"email": "joao@example.com",
		},
		"decks":         mockDecks,
		"cards":         mockCards,
		"studySessions": mockStudySessions,
		"stats": gin.H{
			"totalXP": 1250,
			"level":   5,
			"badges":  mockBadges,
		},
		"exportDate": time.Now().Format(time.RFC3339),
	}

	c.JSON(200, exportData)
}

// Sharing handlers
func getPublicDecks(c *gin.Context) {
	search := c.Query("search")
	tags := c.Query("tags")

	var publicDecks []MockDeck
	for _, deck := range mockDecks {
		if deck.IsPublic {
			publicDecks = append(publicDecks, deck)
		}
	}

	c.JSON(200, gin.H{
		"decks":  publicDecks,
		"search": search,
		"tags":   tags,
	})
}

func generateShareLink(c *gin.Context) {
	deckID := c.Param("id")

	c.JSON(200, gin.H{
		"shareUrl":  fmt.Sprintf("https://flashcard-app.com/share/%s", deckID),
		"shareCode": "ABC123",
	})
}

func importDeck(c *gin.Context) {
	var data struct {
		ShareCode string   `json:"shareCode"`
		DeckData  MockDeck `json:"deckData"`
	}

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Mock import logic
	newDeckID := strconv.Itoa(len(mockDecks) + 1)

	c.JSON(200, gin.H{
		"deckId":  newDeckID,
		"message": "Deck imported successfully",
	})
}

// Auth handlers
func getAuthURLs(c *gin.Context) {
	urls := gin.H{
		"google":   "https://accounts.google.com/oauth/authorize?client_id=...",
		"linkedin": "https://www.linkedin.com/oauth/v2/authorization?client_id=...",
	}
	c.JSON(200, urls)
}

// Mock study sessions data
var mockStudySessions = []StudySession{
	{
		ID:             "1",
		UserID:         "user1",
		DeckID:         "1",
		CardsReviewed:  10,
		CorrectAnswers: 8,
		TimeSpent:      300,
		StreakBonus:    5,
		XP:             55,
		CreatedAt:      time.Now().AddDate(0, 0, -1),
	},
}
