package favorites

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Handler struct {
	service *FavoriteService
}

func NewHandler(service *FavoriteService) *Handler {
	return &Handler{service: service}
}

// POST /api/decks/:deckId/favorite
func (h *Handler) AddFavorite(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	deckID := c.Param("deckId")
	if deckID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deck ID is required"})
		return
	}
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	deckObjID, err := primitive.ObjectIDFromHex(deckID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid deck ID"})
		return
	}
	err = h.service.AddFavorite(c.Request.Context(), userObjID, deckObjID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deck favorited"})
}

// DELETE /api/decks/:deckId/favorite
func (h *Handler) RemoveFavorite(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	deckID := c.Param("deckId")
	if deckID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deck ID is required"})
		return
	}
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	deckObjID, err := primitive.ObjectIDFromHex(deckID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid deck ID"})
		return
	}
	err = h.service.RemoveFavorite(c.Request.Context(), userObjID, deckObjID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deck unfavorited"})
}

// GET /api/decks/favorites
func (h *Handler) ListFavorites(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	deckIDs, err := h.service.ListFavoriteDeckIDs(c.Request.Context(), userObjID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"favorite_deck_ids": deckIDs})
}
