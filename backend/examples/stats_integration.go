package main

import (
	"context"
	"flashcard-backend/internal/infrastructure/database"
	"flashcard-backend/internal/modules/gamification"
	"log"
)

// Exemplo de como integrar o sistema de estatísticas nos serviços existentes

// ServiceWithStats é um exemplo de serviço que integra o logging de estatísticas
type ServiceWithStats struct {
	statsService *gamification.StatsService
	// outros serviços...
}

func NewServiceWithStats(db *database.MongoDB) *ServiceWithStats {
	return &ServiceWithStats{
		statsService: gamification.NewStatsService(db),
	}
}

// CreateDeckWithStats exemplo de criação de deck com logging de estatísticas
func (s *ServiceWithStats) CreateDeckWithStats(ctx context.Context, userID, deckID string, xp int) error {
	// Lógica de criação do deck...

	// Log da criação do deck
	err := s.statsService.LogDeckCreated(ctx, userID, deckID, xp)
	if err != nil {
		log.Printf("Failed to log deck creation: %v", err)
		// Não falhar a operação principal por causa do log
	}

	return nil
}

// CreateCardWithStats exemplo de criação de card com logging de estatísticas
func (s *ServiceWithStats) CreateCardWithStats(ctx context.Context, userID, deckID, cardID string, xp int) error {
	// Lógica de criação do card...

	// Log da criação do card
	err := s.statsService.LogCardCreated(ctx, userID, deckID, cardID, xp)
	if err != nil {
		log.Printf("Failed to log card creation: %v", err)
		// Não falhar a operação principal por causa do log
	}

	return nil
}

// StartStudySessionWithStats exemplo de início de sessão com logging
func (s *ServiceWithStats) StartStudySessionWithStats(ctx context.Context, userID, sessionID, deckID string) error {
	// Lógica de início da sessão...

	// Log do início da sessão
	err := s.statsService.LogStudySessionStart(ctx, userID, sessionID, deckID)
	if err != nil {
		log.Printf("Failed to log study session start: %v", err)
		// Não falhar a operação principal por causa do log
	}

	return nil
}

// EndStudySessionWithStats exemplo de fim de sessão com logging
func (s *ServiceWithStats) EndStudySessionWithStats(ctx context.Context, userID, sessionID string, studyTime, xp, streak, level int) error {
	// Lógica de fim da sessão...

	// Log do fim da sessão
	err := s.statsService.LogStudySessionEnd(ctx, userID, sessionID, studyTime, xp, streak, level)
	if err != nil {
		log.Printf("Failed to log study session end: %v", err)
		// Não falhar a operação principal por causa do log
	}

	return nil
}

// ReviewCardWithStats exemplo de revisão de card com logging
func (s *ServiceWithStats) ReviewCardWithStats(ctx context.Context, userID, deckID, cardID, difficulty string, isCorrect bool, studyTime, xp int) error {
	// Lógica de revisão do card...

	// Log da revisão do card
	err := s.statsService.LogCardReview(ctx, userID, deckID, cardID, difficulty, isCorrect, studyTime, xp)
	if err != nil {
		log.Printf("Failed to log card review: %v", err)
		// Não falhar a operação principal por causa do log
	}

	return nil
}

// UnlockAchievementWithStats exemplo de desbloqueio de conquista com logging
func (s *ServiceWithStats) UnlockAchievementWithStats(ctx context.Context, userID, achievementID string, xp int) error {
	// Lógica de desbloqueio da conquista...

	// Log do desbloqueio da conquista
	err := s.statsService.LogAchievementUnlocked(ctx, userID, achievementID, xp)
	if err != nil {
		log.Printf("Failed to log achievement unlock: %v", err)
		// Não falhar a operação principal por causa do log
	}

	return nil
}

// Exemplo de uso no handler de flashcards
func ExampleFlashcardHandlerIntegration() {
	// No handler de criação de deck:
	/*
		func (h *Handler) CreateDeck(c *gin.Context) {
			userID := c.GetString("user_id")
			// ... lógica de criação do deck

			// Após criar o deck com sucesso:
			err := h.statsService.LogDeckCreated(c.Request.Context(), userID, deck.ID.Hex(), 25)
			if err != nil {
				log.Printf("Failed to log deck creation: %v", err)
			}

			c.JSON(http.StatusCreated, deck)
		}
	*/

	// No handler de criação de card:
	/*
		func (h *Handler) CreateFlashcard(c *gin.Context) {
			userID := c.GetString("user_id")
			// ... lógica de criação do card

			// Após criar o card com sucesso:
			err := h.statsService.LogCardCreated(c.Request.Context(), userID, deckID, card.ID.Hex(), 10)
			if err != nil {
				log.Printf("Failed to log card creation: %v", err)
			}

			c.JSON(http.StatusCreated, card)
		}
	*/

	// No handler de início de sessão de estudo:
	/*
		func (h *Handler) StartStudySession(c *gin.Context) {
			userID := c.GetString("user_id")
			// ... lógica de início da sessão

			// Após iniciar a sessão com sucesso:
			err := h.statsService.LogStudySessionStart(c.Request.Context(), userID, session.ID.Hex(), deckID)
			if err != nil {
				log.Printf("Failed to log study session start: %v", err)
			}

			c.JSON(http.StatusCreated, session)
		}
	*/

	// No handler de fim de sessão de estudo:
	/*
		func (h *Handler) EndStudySession(c *gin.Context) {
			userID := c.GetString("user_id")
			// ... lógica de fim da sessão

			// Após finalizar a sessão com sucesso:
			err := h.statsService.LogStudySessionEnd(c.Request.Context(), userID, sessionID, studyTime, xp, streak, level)
			if err != nil {
				log.Printf("Failed to log study session end: %v", err)
			}

			c.JSON(http.StatusOK, gin.H{"message": "Session ended"})
		}
	*/

	// No handler de revisão de card:
	/*
		func (h *Handler) ReviewCard(c *gin.Context) {
			userID := c.GetString("user_id")
			// ... lógica de revisão do card

			// Após revisar o card com sucesso:
			err := h.statsService.LogCardReview(c.Request.Context(), userID, deckID, cardID, difficulty, isCorrect, studyTime, xp)
			if err != nil {
				log.Printf("Failed to log card review: %v", err)
			}

			c.JSON(http.StatusOK, gin.H{"message": "Card reviewed"})
		}
	*/
}

// Exemplo de como obter estatísticas
func ExampleGetStats() {
	// No handler de estatísticas:
	/*
		func (h *Handler) GetStats(c *gin.Context) {
			userID := c.GetString("user_id")

			// Resumo das estatísticas
			summary, err := h.statsService.GetStudyStatsSummary(c.Request.Context(), userID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stats summary"})
				return
			}

			// Estatísticas por período (últimos 7 dias)
			weeklyStats, err := h.statsService.GetStudyStatsByPeriod(c.Request.Context(), userID, "day", 7)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get weekly stats"})
				return
			}

			// Performance por dificuldade
			difficultyStats, err := h.statsService.GetPerformanceByDifficulty(c.Request.Context(), userID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get difficulty stats"})
				return
			}

			// Performance por deck
			deckStats, err := h.statsService.GetDeckPerformance(c.Request.Context(), userID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get deck stats"})
				return
			}

			response := gin.H{
				"summary": summary,
				"weekly_stats": weeklyStats,
				"difficulty_stats": difficultyStats,
				"deck_stats": deckStats,
			}

			c.JSON(http.StatusOK, response)
		}
	*/
}
