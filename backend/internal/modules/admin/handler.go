package admin

import (
	"net/http"

	"flashcard-backend/internal/domain/entities"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// GET /api/admin/config
func (h *Handler) GetConfig(c *gin.Context) {
	config, err := h.service.GetConfig(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

// PUT /api/admin/config
func (h *Handler) UpdateConfig(c *gin.Context) {
	var req entities.AdminConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.UpdateConfig(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Config updated successfully"})
}

// GET /api/admin/users
func (h *Handler) GetAllAdminUsers(c *gin.Context) {
	adminUsers, err := h.service.GetAllAdminUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, adminUsers)
}

// POST /api/admin/users
func (h *Handler) CreateAdminUser(c *gin.Context) {
	var req struct {
		UserID string `json:"user_id" binding:"required"`
		Email  string `json:"email" binding:"required,email"`
		Role   string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := primitive.ObjectIDFromHex(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	adminUser, err := h.service.CreateAdminUser(c.Request.Context(), userID, req.Email, req.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, adminUser)
}

// PUT /api/admin/users/:id
func (h *Handler) UpdateAdminUser(c *gin.Context) {
	adminUserID := c.Param("id")
	if adminUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Admin user ID is required"})
		return
	}

	objectID, err := primitive.ObjectIDFromHex(adminUserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid admin user ID"})
		return
	}

	var req entities.AdminUser
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.ID = objectID
	err = h.service.UpdateAdminUser(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Admin user updated successfully"})
}

// DELETE /api/admin/users/:id
func (h *Handler) DeleteAdminUser(c *gin.Context) {
	adminUserID := c.Param("id")
	if adminUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Admin user ID is required"})
		return
	}

	objectID, err := primitive.ObjectIDFromHex(adminUserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid admin user ID"})
		return
	}

	err = h.service.DeleteAdminUser(c.Request.Context(), objectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Admin user deleted successfully"})
}

// GET /api/admin/limits
func (h *Handler) GetLimits(c *gin.Context) {
	config, err := h.service.GetConfig(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	limits := gin.H{
		"free_plan": gin.H{
			"deck_limit": config.FreePlanDeckLimit,
			"card_limit": config.FreePlanCardLimit,
		},
		"premium_plan": gin.H{
			"deck_limit": config.PremiumPlanDeckLimit,
			"card_limit": config.PremiumPlanCardLimit,
		},
		"public": gin.H{
			"deck_limit": config.FreePlanPublicDeckLimit,
			"card_limit": config.FreePlanCardLimit,
		},
	}

	c.JSON(http.StatusOK, limits)
}
