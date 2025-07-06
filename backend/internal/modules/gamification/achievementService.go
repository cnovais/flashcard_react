package gamification

import (
	"context"
	"fmt"
	"time"

	"flashcard-backend/internal/domain/entities"
)

type AchievementService struct {
	achievementRepo *AchievementRepository
	statsRepo       *StatsRepository
}

func NewAchievementService(achievementRepo *AchievementRepository, statsRepo *StatsRepository) *AchievementService {
	return &AchievementService{
		achievementRepo: achievementRepo,
		statsRepo:       statsRepo,
	}
}

func (s *AchievementService) InitializeUserAchievements(userID string) error {
	return s.achievementRepo.InitializeUserAchievements(userID)
}

func (s *AchievementService) GetUserAchievements(userID string) ([]entities.Achievement, error) {
	return s.achievementRepo.GetUserAchievements(userID)
}

func (s *AchievementService) GetUnlockedAchievements(userID string) ([]entities.Achievement, error) {
	return s.achievementRepo.GetUnlockedAchievements(userID)
}

func (s *AchievementService) GetAchievementsByCategory(userID, category string) ([]entities.Achievement, error) {
	return s.achievementRepo.GetAchievementsByCategory(userID, category)
}

func (s *AchievementService) CheckAndUnlockAchievements(userID string) ([]entities.Achievement, error) {
	achievements, err := s.achievementRepo.GetUserAchievements(userID)
	if err != nil {
		return nil, err
	}

	var newlyUnlocked []entities.Achievement

	for _, achievement := range achievements {
		if achievement.Unlocked {
			continue
		}

		shouldUnlock, progress, err := s.checkAchievementCondition(userID, achievement)
		if err != nil {
			continue // Skip this achievement if there's an error
		}

		// Update progress
		if progress != achievement.Progress {
			err = s.achievementRepo.UpdateProgress(userID, achievement.Name, progress)
			if err != nil {
				continue
			}
		}

		if shouldUnlock {
			err = s.achievementRepo.UnlockAchievement(userID, achievement.Name, progress)
			if err != nil {
				continue
			}

			achievement.Unlocked = true
			achievement.UnlockedAt = &time.Time{}
			*achievement.UnlockedAt = time.Now()
			achievement.Progress = progress
			newlyUnlocked = append(newlyUnlocked, achievement)
		}
	}

	return newlyUnlocked, nil
}

func (s *AchievementService) checkAchievementCondition(userID string, achievement entities.Achievement) (bool, int, error) {
	condition := achievement.Condition
	var currentValue int
	var err error

	switch condition.Type {
	case "total_decks":
		currentValue, err = s.getTotalDecks(userID)
	case "total_cards":
		currentValue, err = s.getTotalCards(userID)
	case "total_sessions":
		currentValue, err = s.getTotalSessions(userID)
	case "total_study_time":
		currentValue, err = s.getTotalStudyTime(userID)
	case "study_streak":
		currentValue, err = s.getStudyStreak(userID)
	case "session_accuracy":
		currentValue, err = s.getSessionAccuracy(userID)
	case "cards_per_session":
		currentValue, err = s.getCardsPerSession(userID)
	default:
		return false, 0, fmt.Errorf("unknown condition type: %s", condition.Type)
	}

	if err != nil {
		return false, 0, err
	}

	shouldUnlock := false
	switch condition.Operator {
	case ">=":
		shouldUnlock = currentValue >= condition.Value
	case "<=":
		shouldUnlock = currentValue <= condition.Value
	case "==":
		shouldUnlock = currentValue == condition.Value
	case ">":
		shouldUnlock = currentValue > condition.Value
	case "<":
		shouldUnlock = currentValue < condition.Value
	}

	return shouldUnlock, currentValue, nil
}

func (s *AchievementService) getTotalDecks(userID string) (int, error) {
	// Implementar consulta para contar decks do usuário
	// Por enquanto, retornar 0
	return 0, nil
}

func (s *AchievementService) getTotalCards(userID string) (int, error) {
	// Implementar consulta para contar cards do usuário
	// Por enquanto, retornar 0
	return 0, nil
}

func (s *AchievementService) getTotalSessions(userID string) (int, error) {
	summary, err := s.statsRepo.GetStudyStatsSummary(context.Background(), userID)
	if err != nil {
		return 0, err
	}
	return summary.TotalSessions, nil
}

func (s *AchievementService) getTotalStudyTime(userID string) (int, error) {
	summary, err := s.statsRepo.GetStudyStatsSummary(context.Background(), userID)
	if err != nil {
		return 0, err
	}
	return summary.TotalStudyTime, nil
}

func (s *AchievementService) getStudyStreak(userID string) (int, error) {
	summary, err := s.statsRepo.GetStudyStatsSummary(context.Background(), userID)
	if err != nil {
		return 0, err
	}
	return summary.StudyStreak, nil
}

func (s *AchievementService) getSessionAccuracy(userID string) (int, error) {
	// Buscar a precisão da sessão mais recente
	stats, err := s.statsRepo.GetStudyStatsByPeriod(context.Background(), userID, "day", 1)
	if err != nil || len(stats) == 0 {
		return 0, err
	}

	// Retornar a precisão da sessão mais recente
	return int(stats[0].Accuracy), nil
}

func (s *AchievementService) getCardsPerSession(userID string) (int, error) {
	// Buscar o número de cards da sessão mais recente
	stats, err := s.statsRepo.GetStudyStatsByPeriod(context.Background(), userID, "day", 1)
	if err != nil || len(stats) == 0 {
		return 0, err
	}

	// Retornar o número de cards da sessão mais recente
	return stats[0].CardsReviewed, nil
}

// Método para verificar conquistas após ações específicas
func (s *AchievementService) CheckAchievementsAfterAction(userID, actionType string, actionData map[string]interface{}) ([]entities.Achievement, error) {
	// Primeiro, verificar conquistas baseadas em estatísticas gerais
	newlyUnlocked, err := s.CheckAndUnlockAchievements(userID)
	if err != nil {
		return nil, err
	}

	// Verificar conquistas específicas baseadas na ação
	switch actionType {
	case "deck_created":
		// Verificar conquistas de criação de deck
		deckAchievements, err := s.checkDeckCreationAchievements(userID)
		if err == nil {
			newlyUnlocked = append(newlyUnlocked, deckAchievements...)
		}
	case "card_created":
		// Verificar conquistas de criação de card
		cardAchievements, err := s.checkCardCreationAchievements(userID)
		if err == nil {
			newlyUnlocked = append(newlyUnlocked, cardAchievements...)
		}
	case "study_session_completed":
		// Verificar conquistas de sessão de estudo
		sessionAchievements, err := s.checkStudySessionAchievements(userID, actionData)
		if err == nil {
			newlyUnlocked = append(newlyUnlocked, sessionAchievements...)
		}
	}

	return newlyUnlocked, nil
}

func (s *AchievementService) checkDeckCreationAchievements(userID string) ([]entities.Achievement, error) {
	// Implementar verificação específica para conquistas de criação de deck
	return []entities.Achievement{}, nil
}

func (s *AchievementService) checkCardCreationAchievements(userID string) ([]entities.Achievement, error) {
	// Implementar verificação específica para conquistas de criação de card
	return []entities.Achievement{}, nil
}

func (s *AchievementService) checkStudySessionAchievements(userID string, actionData map[string]interface{}) ([]entities.Achievement, error) {
	// Implementar verificação específica para conquistas de sessão de estudo
	return []entities.Achievement{}, nil
}
