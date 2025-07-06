package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Deck struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CardCount   int       `json:"cardCount"`
	CreatedAt   time.Time `json:"createdAt"`
}

type Flashcard struct {
	ID       string `json:"id"`
	DeckID   string `json:"deckId"`
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

func main() {
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Flashcard API is running"})
	})

	// Mock data
	decks := []Deck{
		{
			ID:          "1",
			Name:        "Matemática Básica",
			Description: "Conceitos fundamentais de matemática",
			CardCount:   15,
			CreatedAt:   time.Now(),
		},
		{
			ID:          "2",
			Name:        "História do Brasil",
			Description: "Principais eventos da história brasileira",
			CardCount:   20,
			CreatedAt:   time.Now().Add(-24 * time.Hour),
		},
	}

	cards := []Flashcard{
		{
			ID:       "1",
			DeckID:   "1",
			Question: "Quanto é 2 + 2?",
			Answer:   "4",
		},
		{
			ID:       "2",
			DeckID:   "1",
			Question: "Quanto é 5 x 5?",
			Answer:   "25",
		},
		{
			ID:       "3",
			DeckID:   "2",
			Question: "Em que ano o Brasil foi descoberto?",
			Answer:   "1500",
		},
	}

	// API Routes
	api := r.Group("/api")
	{
		// Decks
		api.GET("/decks", func(c *gin.Context) {
			c.JSON(200, decks)
		})

		api.GET("/decks/:id", func(c *gin.Context) {
			id := c.Param("id")
			for _, deck := range decks {
				if deck.ID == id {
					c.JSON(200, deck)
					return
				}
			}
			c.JSON(404, gin.H{"error": "Deck not found"})
		})

		api.POST("/decks", func(c *gin.Context) {
			var newDeck Deck
			if err := c.ShouldBindJSON(&newDeck); err != nil {
				c.JSON(400, gin.H{"error": err.Error()})
				return
			}

			newDeck.ID = fmt.Sprintf("%d", len(decks)+1)
			newDeck.CreatedAt = time.Now()
			decks = append(decks, newDeck)

			c.JSON(201, newDeck)
		})

		// Cards
		api.GET("/cards/deck/:deckId", func(c *gin.Context) {
			deckID := c.Param("deckId")
			var deckCards []Flashcard
			
			for _, card := range cards {
				if card.DeckID == deckID {
					deckCards = append(deckCards, card)
				}
			}
			
			c.JSON(200, deckCards)
		})

		api.POST("/cards", func(c *gin.Context) {
			var newCard Flashcard
			if err := c.ShouldBindJSON(&newCard); err != nil {
				c.JSON(400, gin.H{"error": err.Error()})
				return
			}

			newCard.ID = fmt.Sprintf("%d", len(cards)+1)
			cards = append(cards, newCard)

			c.JSON(201, newCard)
		})
	}

	// Auth routes (mock)
	auth := r.Group("/auth")
	{
		auth.GET("/urls", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"google":   "https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=test",
				"linkedin": "https://www.linkedin.com/oauth/v2/authorization?client_id=test&redirect_uri=test",
			})
		})

		auth.GET("/google", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"user": gin.H{
					"id":    "1",
					"name":  "Test User",
					"email": "test@example.com",
					"plan":  "free",
				},
				"token": "mock-jwt-token",
			})
		})

		auth.GET("/linkedin", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"user": gin.H{
					"id":    "1",
					"name":  "Test User",
					"email": "test@example.com",
					"plan":  "free",
				},
				"token": "mock-jwt-token",
			})
		})
	}

	fmt.Println("🚀 Flashcard API Server starting on http://localhost:8080")
	fmt.Println("📚 Available endpoints:")
	fmt.Println("   GET  /health")
	fmt.Println("   GET  /api/decks")
	fmt.Println("   GET  /api/decks/:id")
	fmt.Println("   POST /api/decks")
	fmt.Println("   GET  /api/cards/deck/:deckId")
	fmt.Println("   POST /api/cards")
	fmt.Println("   GET  /auth/urls")
	fmt.Println("   GET  /auth/google")
	fmt.Println("   GET  /auth/linkedin")

	log.Fatal(r.Run(":8080"))
} 