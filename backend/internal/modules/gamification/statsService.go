package gamification

import (
	"context"
	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/infrastructure/database"
)

type StatsService struct {
	repo *StatsRepository
}

func NewStatsService(db *database.MongoDB) *StatsService {
	return &StatsService{
		repo: NewStatsRepository(db),
	}
}

// LogStudyAction registra uma ação de estudo
func (s *StatsService) LogStudyAction(ctx context.Context, userID string, actionType string, metadata map[string]interface{}) error {
	stats := &entities.StudyStats{
		UserID:     userID,
		ActionType: actionType,
		Metadata:   metadata,
	}

	// Adicionar campos específicos baseados no tipo de ação
	switch actionType {
	case "study_session_start":
		if sessionID, ok := metadata["session_id"].(string); ok {
			stats.SessionID = sessionID
		}
		if deckID, ok := metadata["deck_id"].(string); ok {
			stats.DeckID = deckID
		}
	case "study_session_end":
		if sessionID, ok := metadata["session_id"].(string); ok {
			stats.SessionID = sessionID
		}
		if studyTime, ok := metadata["study_time"].(int); ok {
			stats.StudyTime = studyTime
		}
		if xp, ok := metadata["xp"].(int); ok {
			stats.XP = xp
		}
		if streak, ok := metadata["streak"].(int); ok {
			stats.Streak = streak
		}
		if level, ok := metadata["level"].(int); ok {
			stats.Level = level
		}
	case "card_review":
		if deckID, ok := metadata["deck_id"].(string); ok {
			stats.DeckID = deckID
		}
		if cardID, ok := metadata["card_id"].(string); ok {
			stats.CardID = cardID
		}
		if difficulty, ok := metadata["difficulty"].(string); ok {
			stats.Difficulty = difficulty
		}
		if isCorrect, ok := metadata["is_correct"].(bool); ok {
			stats.IsCorrect = &isCorrect
		}
		if studyTime, ok := metadata["study_time"].(int); ok {
			stats.StudyTime = studyTime
		}
		if xp, ok := metadata["xp"].(int); ok {
			stats.XP = xp
		}
	case "deck_created":
		if deckID, ok := metadata["deck_id"].(string); ok {
			stats.DeckID = deckID
		}
		if xp, ok := metadata["xp"].(int); ok {
			stats.XP = xp
		}
	case "card_created":
		if deckID, ok := metadata["deck_id"].(string); ok {
			stats.DeckID = deckID
		}
		if cardID, ok := metadata["card_id"].(string); ok {
			stats.CardID = cardID
		}
		if xp, ok := metadata["xp"].(int); ok {
			stats.XP = xp
		}
	case "achievement_unlocked":
		if achievementID, ok := metadata["achievement_id"].(string); ok {
			stats.Metadata["achievement_id"] = achievementID
		}
		if xp, ok := metadata["xp"].(int); ok {
			stats.XP = xp
		}
	}

	return s.repo.CreateStudyStats(ctx, stats)
}

// GetStudyStatsSummary retorna um resumo das estatísticas do usuário
func (s *StatsService) GetStudyStatsSummary(ctx context.Context, userID string) (*entities.StudyStatsSummary, error) {
	return s.repo.GetStudyStatsSummary(ctx, userID)
}

// GetStudyStatsByPeriod retorna estatísticas agrupadas por período
func (s *StatsService) GetStudyStatsByPeriod(ctx context.Context, userID string, period string, days int) ([]entities.StudyStatsByPeriod, error) {
	return s.repo.GetStudyStatsByPeriod(ctx, userID, period, days)
}

// GetPerformanceByDifficulty retorna performance por dificuldade
func (s *StatsService) GetPerformanceByDifficulty(ctx context.Context, userID string) ([]entities.PerformanceByDifficulty, error) {
	return s.repo.GetPerformanceByDifficulty(ctx, userID)
}

// GetDeckPerformance retorna performance por deck
func (s *StatsService) GetDeckPerformance(ctx context.Context, userID string) ([]entities.DeckPerformance, error) {
	return s.repo.GetDeckPerformance(ctx, userID)
}

// LogStudySessionStart registra o início de uma sessão de estudo
func (s *StatsService) LogStudySessionStart(ctx context.Context, userID, sessionID, deckID string) error {
	metadata := map[string]interface{}{
		"session_id": sessionID,
		"deck_id":    deckID,
	}
	return s.LogStudyAction(ctx, userID, "study_session_start", metadata)
}

// LogStudySessionEnd registra o fim de uma sessão de estudo
func (s *StatsService) LogStudySessionEnd(ctx context.Context, userID, sessionID string, studyTime, xp, streak, level int) error {
	metadata := map[string]interface{}{
		"session_id": sessionID,
		"study_time": studyTime,
		"xp":         xp,
		"streak":     streak,
		"level":      level,
	}
	return s.LogStudyAction(ctx, userID, "study_session_end", metadata)
}

// LogCardReview registra uma revisão de card
func (s *StatsService) LogCardReview(ctx context.Context, userID, deckID, cardID, difficulty string, isCorrect bool, studyTime, xp int) error {
	metadata := map[string]interface{}{
		"deck_id":    deckID,
		"card_id":    cardID,
		"difficulty": difficulty,
		"is_correct": isCorrect,
		"study_time": studyTime,
		"xp":         xp,
	}
	return s.LogStudyAction(ctx, userID, "card_review", metadata)
}

// LogDeckCreated registra a criação de um deck
func (s *StatsService) LogDeckCreated(ctx context.Context, userID, deckID string, xp int) error {
	metadata := map[string]interface{}{
		"deck_id": deckID,
		"xp":      xp,
	}
	return s.LogStudyAction(ctx, userID, "deck_created", metadata)
}

// LogCardCreated registra a criação de um card
func (s *StatsService) LogCardCreated(ctx context.Context, userID, deckID, cardID string, xp int) error {
	metadata := map[string]interface{}{
		"deck_id": deckID,
		"card_id": cardID,
		"xp":      xp,
	}
	return s.LogStudyAction(ctx, userID, "card_created", metadata)
}

// LogAchievementUnlocked registra o desbloqueio de uma conquista
func (s *StatsService) LogAchievementUnlocked(ctx context.Context, userID, achievementID string, xp int) error {
	metadata := map[string]interface{}{
		"achievement_id": achievementID,
		"xp":             xp,
	}
	return s.LogStudyAction(ctx, userID, "achievement_unlocked", metadata)
}

// GetTimeDistribution retorna a distribuição de estudo por período do dia
func (s *StatsService) GetTimeDistribution(ctx context.Context, userID string) (*entities.TimeDistribution, error) {
	return s.repo.GetTimeDistribution(ctx, userID)
}
