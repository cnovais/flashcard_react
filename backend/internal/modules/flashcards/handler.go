package flashcards

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"flashcard-backend/internal/config"
	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/modules/gamification"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Handler struct {
	service      *Service
	statsService *gamification.StatsService
	cfg          *config.Config
}

func NewHandler(service *Service, statsService *gamification.StatsService, cfg *config.Config) *Handler {
	return &Handler{
		service:      service,
		statsService: statsService,
		cfg:          cfg,
	}
}

// Deck handlers
func (h *Handler) CreateDeck(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// O user_id já deve vir como string do middleware
	userIDStr, ok := userID.(string)
	if !ok {
		fmt.Printf("CreateDeck: user_id is not string: %T %v\n", userID, userID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	fmt.Printf("CreateDeck: user_id: %s\n", userIDStr)

	var req struct {
		Name        string   `json:"name" binding:"required"`
		Description string   `json:"description"`
		Tags        []string `json:"tags"`
		IsPublic    bool     `json:"isPublic"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("CreateDeck: request data: %+v\n", req)

	deck, err := h.service.CreateDeck(userIDStr, req.Name, req.Description, req.Tags, req.IsPublic)
	if err != nil {
		fmt.Printf("CreateDeck: service error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log da criação do deck
	err = h.statsService.LogDeckCreated(c.Request.Context(), userIDStr, deck.ID.Hex(), 25)
	if err != nil {
		fmt.Printf("Failed to log deck creation: %v\n", err)
		// Não falhar a operação principal por causa do log
	}

	c.JSON(http.StatusCreated, deck)
}

func (h *Handler) GetDecks(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Converter ObjectID para string
	var userIDStr string
	if objectID, ok := userID.(primitive.ObjectID); ok {
		userIDStr = objectID.Hex()
	} else if str, ok := userID.(string); ok {
		userIDStr = str
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	// NOVO: ler filtros da query
	visibility := c.DefaultQuery("visibility", "all")
	search := c.DefaultQuery("search", "")

	decks, err := h.service.GetDecksByUserIDWithFilter(userIDStr, visibility, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Garantir que sempre retorne um array, mesmo que vazio
	if decks == nil {
		decks = []entities.Deck{}
	}

	c.JSON(http.StatusOK, decks)
}

func (h *Handler) GetDeck(c *gin.Context) {
	deckID := c.Param("id")
	if deckID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deck ID is required"})
		return
	}

	deck, err := h.service.GetDeckByID(deckID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Deck not found"})
		return
	}

	c.JSON(http.StatusOK, deck)
}

func (h *Handler) UpdateDeck(c *gin.Context) {
	deckID := c.Param("id")
	if deckID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deck ID is required"})
		return
	}

	var req struct {
		Name        string   `json:"name" binding:"required"`
		Description string   `json:"description"`
		Tags        []string `json:"tags"`
		Color       string   `json:"color"`
		Border      string   `json:"border"`
		Background  string   `json:"background"`
		IsPublic    bool     `json:"isPublic"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	deck, err := h.service.UpdateDeck(deckID, req.Name, req.Description, req.Tags, req.Color, req.Border, req.Background, req.IsPublic)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, deck)
}

func (h *Handler) DeleteDeck(c *gin.Context) {
	deckID := c.Param("id")
	if deckID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deck ID is required"})
		return
	}

	if err := h.service.DeleteDeck(deckID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deck deleted successfully"})
}

// Flashcard handlers
func (h *Handler) CreateFlashcard(c *gin.Context) {
	// Log the raw request body for debugging
	bodyBytes, _ := io.ReadAll(c.Request.Body)
	fmt.Printf("CreateFlashcard: raw body: %s\n", string(bodyBytes))
	// Re-create the body for Gin to parse
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Converter ObjectID para string
	var userIDStr string
	if objectID, ok := userID.(primitive.ObjectID); ok {
		userIDStr = objectID.Hex()
	} else if str, ok := userID.(string); ok {
		userIDStr = str
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	var req struct {
		DeckID             string   `json:"deck_id" binding:"required"`
		Question           string   `json:"question" binding:"required"`
		Answer             string   `json:"answer"`
		Alternatives       []string `json:"alternatives"`
		CorrectAlternative *int     `json:"correctAlternative"`
		ImageURL           string   `json:"image_url"`
		AudioURL           string   `json:"audio_url"`
		Tags               []string `json:"tags"`
		Difficulty         int      `json:"difficulty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("CreateFlashcard: JSON bind error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validação: se não for alternativas, answer é obrigatório
	if len(req.Alternatives) == 0 && req.Answer == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Answer is required for open cards"})
		return
	}
	// Se for alternativas, precisa de pelo menos 2 e correctAlternative
	if len(req.Alternatives) > 0 {
		if len(req.Alternatives) < 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "At least 2 alternatives required"})
			return
		}
		if req.CorrectAlternative == nil || *req.CorrectAlternative < 0 || *req.CorrectAlternative >= len(req.Alternatives) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Valid correctAlternative required"})
			return
		}
	}

	card, err := h.service.CreateFlashcard(
		userIDStr,
		req.DeckID,
		req.Question,
		req.Answer,
		req.Alternatives,
		req.CorrectAlternative,
		req.ImageURL,
		req.AudioURL,
		req.Tags,
		req.Difficulty,
	)
	if err != nil {
		fmt.Printf("CreateFlashcard: service error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log da criação do card
	err = h.statsService.LogCardCreated(c.Request.Context(), userIDStr, req.DeckID, card.ID.Hex(), 10)
	if err != nil {
		fmt.Printf("Failed to log card creation: %v\n", err)
		// Não falhar a operação principal por causa do log
	}

	c.JSON(http.StatusCreated, card)
}

func (h *Handler) GetFlashcards(c *gin.Context) {
	deckID := c.Param("deckId")
	if deckID == "" {
		deckID = c.Query("deckId")
	}
	if deckID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deck ID is required"})
		return
	}

	cards, err := h.service.GetFlashcardsByDeckID(deckID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cards)
}

func (h *Handler) UpdateFlashcard(c *gin.Context) {
	cardID := c.Param("id")
	if cardID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Card ID is required"})
		return
	}

	var req struct {
		Question           string   `json:"question" binding:"required"`
		Answer             string   `json:"answer"`
		Alternatives       []string `json:"alternatives"`
		CorrectAlternative *int     `json:"correctAlternative"`
		ImageURL           string   `json:"image_url"`
		AudioURL           string   `json:"audio_url"`
		Tags               []string `json:"tags"`
		Difficulty         int      `json:"difficulty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validação: se não for alternativas, answer é obrigatório
	if len(req.Alternatives) == 0 && req.Answer == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Answer is required for open cards"})
		return
	}
	// Se for alternativas, precisa de pelo menos 2 e correctAlternative
	if len(req.Alternatives) > 0 {
		if len(req.Alternatives) < 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "At least 2 alternatives required"})
			return
		}
		if req.CorrectAlternative == nil || *req.CorrectAlternative < 0 || *req.CorrectAlternative >= len(req.Alternatives) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Valid correctAlternative required"})
			return
		}
	}

	card, err := h.service.UpdateFlashcard(cardID, req.Question, req.Answer, req.Alternatives, req.CorrectAlternative, req.ImageURL, req.AudioURL, req.Tags, req.Difficulty)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, card)
}

func (h *Handler) DeleteFlashcard(c *gin.Context) {
	cardID := c.Param("id")
	if cardID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Card ID is required"})
		return
	}

	if err := h.service.DeleteFlashcard(cardID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Flashcard deleted successfully"})
}

// Study session handlers
func (h *Handler) StartStudySession(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		DeckID string `json:"deck_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session, err := h.service.StartStudySession(userID.(string), req.DeckID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log do início da sessão
	err = h.statsService.LogStudySessionStart(c.Request.Context(), userID.(string), session.ID.Hex(), req.DeckID)
	if err != nil {
		fmt.Printf("Failed to log study session start: %v\n", err)
		// Não falhar a operação principal por causa do log
	}

	c.JSON(http.StatusCreated, session)
}

func (h *Handler) EndStudySession(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID is required"})
		return
	}

	var req struct {
		CardsReviewed int     `json:"cards_reviewed" binding:"required"`
		Score         float64 `json:"score" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.EndStudySession(sessionID, req.CardsReviewed, req.Score); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Log do fim da sessão (valores de exemplo para XP, streak e level)
	userID, exists := c.Get("user_id")
	if exists {
		userIDStr := userID.(string)
		studyTime := req.CardsReviewed * 30 // estimativa de 30 segundos por card
		xp := req.CardsReviewed * 5         // 5 XP por card
		streak := 1                         // valor de exemplo
		level := 1                          // valor de exemplo

		err := h.statsService.LogStudySessionEnd(c.Request.Context(), userIDStr, sessionID, studyTime, xp, streak, level)
		if err != nil {
			fmt.Printf("Failed to log study session end: %v\n", err)
			// Não falhar a operação principal por causa do log
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Study session ended successfully"})
}

// ReviewCard registra uma revisão de card com estatísticas
func (h *Handler) ReviewCard(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		DeckID     string `json:"deck_id" binding:"required"`
		CardID     string `json:"card_id" binding:"required"`
		Difficulty string `json:"difficulty" binding:"required"` // "easy", "good", "hard", "again"
		IsCorrect  bool   `json:"is_correct"`
		StudyTime  int    `json:"study_time"` // em segundos
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calcular XP baseado na dificuldade e acurácia
	xp := 0
	switch req.Difficulty {
	case "easy":
		xp = 1
	case "good":
		xp = 2
	case "hard":
		xp = 3
	case "again":
		xp = 0
	}

	if req.IsCorrect {
		xp *= 2 // bônus por acertar
	}

	// Log da revisão do card
	err := h.statsService.LogCardReview(
		c.Request.Context(),
		userID.(string),
		req.DeckID,
		req.CardID,
		req.Difficulty,
		req.IsCorrect,
		req.StudyTime,
		xp,
	)
	if err != nil {
		fmt.Printf("Failed to log card review: %v\n", err)
		// Não falhar a operação principal por causa do log
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Card reviewed successfully",
		"xp":      xp,
	})
}

func (h *Handler) GetStudyHistory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.ParseInt(limitStr, 10, 64)
	if err != nil {
		limit = 10
	}

	sessions, err := h.service.GetStudyHistory(userID.(string), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sessions)
}
