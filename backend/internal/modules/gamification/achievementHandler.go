package gamification

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type AchievementHandler struct {
	achievementService *AchievementService
}

func NewAchievementHandler(achievementService *AchievementService) *AchievementHandler {
	return &AchievementHandler{
		achievementService: achievementService,
	}
}

// GetUserAchievements retorna todas as conquistas do usuário
func (h *AchievementHandler) GetUserAchievements(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr := userID.(string)
	achievements, err := h.achievementService.GetUserAchievements(userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get achievements"})
		return
	}

	c.JSON(http.StatusOK, achievements)
}

// GetUnlockedAchievements retorna apenas as conquistas desbloqueadas
func (h *AchievementHandler) GetUnlockedAchievements(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr := userID.(string)
	achievements, err := h.achievementService.GetUnlockedAchievements(userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unlocked achievements"})
		return
	}

	c.JSON(http.StatusOK, achievements)
}

// GetAchievementsByCategory retorna conquistas por categoria
func (h *AchievementHandler) GetAchievementsByCategory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	category := c.Param("category")
	if category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category is required"})
		return
	}

	userIDStr := userID.(string)
	achievements, err := h.achievementService.GetAchievementsByCategory(userIDStr, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get achievements by category"})
		return
	}

	c.JSON(http.StatusOK, achievements)
}

// CheckAchievements verifica e desbloqueia conquistas
func (h *AchievementHandler) CheckAchievements(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr := userID.(string)
	newlyUnlocked, err := h.achievementService.CheckAndUnlockAchievements(userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check achievements"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"newly_unlocked": newlyUnlocked,
		"count":          len(newlyUnlocked),
	})
}

// InitializeAchievements inicializa as conquistas do usuário
func (h *AchievementHandler) InitializeAchievements(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr := userID.(string)
	err := h.achievementService.InitializeUserAchievements(userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize achievements"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Achievements initialized successfully"})
}
