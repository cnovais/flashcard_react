package gamification

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/infrastructure/database"

	"github.com/gin-gonic/gin"
)

type StatsHandler struct {
	statsService       *StatsService
	achievementService *AchievementService
}

func NewStatsHandler(db *database.MongoDB) *StatsHandler {
	achievementRepo := NewAchievementRepository(db)
	statsRepo := NewStatsRepository(db)
	achievementService := NewAchievementService(achievementRepo, statsRepo)

	return &StatsHandler{
		statsService:       NewStatsService(db),
		achievementService: achievementService,
	}
}

// GetStudyStatsSummary retorna um resumo das estatísticas do usuário
func (h *StatsHandler) GetStudyStatsSummary(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	summary, err := h.statsService.GetStudyStatsSummary(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get study stats summary"})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// GetStudyStatsByPeriod retorna estatísticas agrupadas por período
func (h *StatsHandler) GetStudyStatsByPeriod(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	period := c.Query("period")
	if period == "" {
		period = "day"
	}

	daysStr := c.Query("days")
	days := 30 // padrão 30 dias
	if daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil {
			days = d
		}
	}

	stats, err := h.statsService.GetStudyStatsByPeriod(c.Request.Context(), userID, period, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get study stats by period"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetPerformanceByDifficulty retorna performance por dificuldade
func (h *StatsHandler) GetPerformanceByDifficulty(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	performance, err := h.statsService.GetPerformanceByDifficulty(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get performance by difficulty"})
		return
	}

	c.JSON(http.StatusOK, performance)
}

// GetDeckPerformance retorna performance por deck
func (h *StatsHandler) GetDeckPerformance(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	performance, err := h.statsService.GetDeckPerformance(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get deck performance"})
		return
	}

	c.JSON(http.StatusOK, performance)
}

// GetDetailedStats retorna estatísticas detalhadas
func (h *StatsHandler) GetDetailedStats(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	// Buscar todas as estatísticas
	summary, err := h.statsService.GetStudyStatsSummary(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get study stats summary"})
		return
	}

	performanceByDifficulty, err := h.statsService.GetPerformanceByDifficulty(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get performance by difficulty"})
		return
	}

	deckPerformance, err := h.statsService.GetDeckPerformance(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get deck performance"})
		return
	}

	// Estatísticas por período (últimos 7 dias)
	weeklyStats, err := h.statsService.GetStudyStatsByPeriod(c.Request.Context(), userID, "day", 7)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get weekly stats"})
		return
	}

	// Estatísticas por período (últimos 30 dias)
	monthlyStats, err := h.statsService.GetStudyStatsByPeriod(c.Request.Context(), userID, "day", 30)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get monthly stats"})
		return
	}

	detailedStats := gin.H{
		"summary":                   summary,
		"performance_by_difficulty": performanceByDifficulty,
		"deck_performance":          deckPerformance,
		"weekly_stats":              weeklyStats,
		"monthly_stats":             monthlyStats,
	}

	c.JSON(http.StatusOK, detailedStats)
}

// GetTimeDistribution retorna a distribuição de estudo por período do dia
func (h *StatsHandler) GetTimeDistribution(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	distribution, err := h.statsService.GetTimeDistribution(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get time distribution"})
		return
	}

	c.JSON(http.StatusOK, distribution)
}

// ExportStats exporta estatísticas em formato CSV
func (h *StatsHandler) ExportStats(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr := userID.(string)

	// Obter dados detalhados
	summary, err := h.statsService.GetStudyStatsSummary(context.Background(), userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stats for export"})
		return
	}

	weeklyStats, err := h.statsService.GetStudyStatsByPeriod(context.Background(), userIDStr, "week", 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get weekly stats for export"})
		return
	}

	monthlyStats, err := h.statsService.GetStudyStatsByPeriod(context.Background(), userIDStr, "month", 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get monthly stats for export"})
		return
	}

	performanceByDifficulty, err := h.statsService.GetPerformanceByDifficulty(context.Background(), userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get difficulty stats for export"})
		return
	}

	deckPerformance, err := h.statsService.GetDeckPerformance(context.Background(), userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get deck stats for export"})
		return
	}

	detailedStats := &entities.DetailedStats{
		StudyStatsByPeriod:      append(weeklyStats, monthlyStats...),
		PerformanceByDifficulty: performanceByDifficulty,
		DeckPerformance:         deckPerformance,
	}

	// Gerar CSV
	csvData := generateCSV(detailedStats, summary)

	// Configurar headers para download
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=flashcard_stats.csv")
	c.Header("Content-Length", fmt.Sprintf("%d", len(csvData)))

	c.Data(http.StatusOK, "text/csv", []byte(csvData))
}

func generateCSV(stats *entities.DetailedStats, summary *entities.StudyStatsSummary) string {
	var csv strings.Builder

	// Header
	csv.WriteString("Data,Período,Tempo de Estudo (min),Sessões,Cards Revisados,Precisão (%),XP\n")

	// Dados por período
	for _, stat := range stats.StudyStatsByPeriod {
		csv.WriteString(fmt.Sprintf("%s,%s,%d,%d,%d,%.1f,%d\n",
			stat.Date,
			stat.Period,
			stat.StudyTime/60, // Converter para minutos
			stat.Sessions,
			stat.CardsReviewed,
			stat.Accuracy,
			stat.XP,
		))
	}

	// Resumo
	csv.WriteString("\n")
	csv.WriteString("Resumo\n")
	csv.WriteString(fmt.Sprintf("Tempo Total de Estudo (horas),%.1f\n", float64(summary.TotalStudyTime)/3600))
	csv.WriteString(fmt.Sprintf("Total de Sessões,%d\n", summary.TotalSessions))
	csv.WriteString(fmt.Sprintf("Total de Cards,%d\n", summary.TotalCards))
	csv.WriteString(fmt.Sprintf("Precisão Média,%.1f%%\n", summary.AverageAccuracy))
	csv.WriteString(fmt.Sprintf("Sequência Atual,%d\n", summary.StudyStreak))
	csv.WriteString(fmt.Sprintf("XP Total,%d\n", summary.TotalXP))
	csv.WriteString(fmt.Sprintf("Nível Atual,%d\n", summary.CurrentLevel))
	csv.WriteString(fmt.Sprintf("Decks Criados,%d\n", summary.DecksCreated))
	csv.WriteString(fmt.Sprintf("Cards Criados,%d\n", summary.CardsCreated))

	// Performance por dificuldade
	csv.WriteString("\n")
	csv.WriteString("Performance por Dificuldade\n")
	csv.WriteString("Dificuldade,Quantidade,Porcentagem,Tempo Médio (seg)\n")
	for _, perf := range stats.PerformanceByDifficulty {
		csv.WriteString(fmt.Sprintf("%s,%d,%.1f%%,%.1f\n",
			perf.Difficulty,
			perf.Count,
			perf.Percentage,
			perf.AverageTime,
		))
	}

	// Performance por deck
	csv.WriteString("\n")
	csv.WriteString("Performance por Deck\n")
	csv.WriteString("Deck,Tempo de Estudo (min),Sessões,Cards Revisados,Precisão (%%)\n")
	for _, deck := range stats.DeckPerformance {
		csv.WriteString(fmt.Sprintf("%s,%d,%d,%d,%.1f\n",
			deck.DeckName,
			deck.StudyTime/60, // Converter para minutos
			deck.Sessions,
			deck.CardsReviewed,
			deck.Accuracy,
		))
	}

	return csv.String()
}

// GetGamificationStats retorna estatísticas de gamificação no formato esperado pelo frontend
func (h *StatsHandler) GetGamificationStats(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	// Buscar estatísticas básicas
	summary, err := h.statsService.GetStudyStatsSummary(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get study stats summary"})
		return
	}

	// Buscar conquistas do usuário
	achievements, err := h.achievementService.GetUserAchievements(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get achievements"})
		return
	}

	// Calcular dados de gamificação
	totalXP := summary.TotalXP
	level := summary.CurrentLevel
	currentLevelXP := 0
	nextLevelXP := 1000 // XP necessário para o próximo nível

	// Calcular XP do nível atual e próximo nível
	if level > 1 {
		// XP necessário para o nível atual
		currentLevelXP = (level - 1) * 1000
		// XP necessário para o próximo nível
		nextLevelXP = level * 1000
	}

	// Contar conquistas desbloqueadas
	unlockedAchievements := 0
	for _, achievement := range achievements {
		if achievement.Unlocked {
			unlockedAchievements++
		}
	}

	// Contar badges (por enquanto, usar conquistas como badges)
	badges := make([]gin.H, 0)
	for _, achievement := range achievements {
		if achievement.Unlocked {
			badges = append(badges, gin.H{
				"id":          achievement.ID,
				"name":        achievement.Name,
				"description": achievement.Description,
				"icon":        achievement.Icon,
				"category":    achievement.Category,
				"rarity":      "common",
				"unlockedAt":  achievement.UnlockedAt,
			})
		}
	}

	// Preparar resposta no formato esperado pelo frontend
	gamificationStats := gin.H{
		"totalXP":            totalXP,
		"level":              level,
		"currentLevelXP":     currentLevelXP,
		"nextLevelXP":        nextLevelXP,
		"studyStreak":        summary.StudyStreak,
		"longestStreak":      summary.StudyStreak, // Por enquanto, usar o streak atual
		"totalCardsCreated":  summary.CardsCreated,
		"totalCardsReviewed": summary.TotalCards,
		"totalStudySessions": summary.TotalSessions,
		"perfectScores":      unlockedAchievements, // Usar conquistas como indicador de scores perfeitos
		"badges":             badges,
		"achievements":       achievements,
		"rank":               1, // Por enquanto, rank fixo
		"totalUsers":         1, // Por enquanto, total fixo
	}

	c.JSON(http.StatusOK, gamificationStats)
}
