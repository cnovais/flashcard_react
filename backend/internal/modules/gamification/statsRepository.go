package gamification

import (
	"context"
	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/infrastructure/database"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type StatsRepository struct {
	db *database.MongoDB
}

func NewStatsRepository(db *database.MongoDB) *StatsRepository {
	return &StatsRepository{db: db}
}

// CreateStudyStats cria uma nova entrada de estatística
func (r *StatsRepository) CreateStudyStats(ctx context.Context, stats *entities.StudyStats) error {
	now := time.Now()
	stats.CreatedAt = now
	stats.Date = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	year, week := now.ISOWeek()
	stats.Week = week
	stats.Month = int(now.Month())
	stats.Year = year

	collection := r.db.GetCollection("study_stats")
	_, err := collection.InsertOne(ctx, stats)
	return err
}

// GetStudyStatsSummary retorna um resumo das estatísticas do usuário
func (r *StatsRepository) GetStudyStatsSummary(ctx context.Context, userID string) (*entities.StudyStatsSummary, error) {
	collection := r.db.GetCollection("study_stats")

	// Pipeline de agregação para calcular estatísticas
	pipeline := []bson.M{
		{"$match": bson.M{"user_id": userID}},
		{"$group": bson.M{
			"_id":                   nil,
			"total_study_time":      bson.M{"$sum": "$study_time"},
			"total_sessions":        bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$eq": []string{"$action_type", "study_session_start"}}, 1, 0}}},
			"total_cards":           bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$eq": []string{"$action_type", "card_review"}}, 1, 0}}},
			"total_xp":              bson.M{"$sum": "$xp"},
			"decks_created":         bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$eq": []string{"$action_type", "deck_created"}}, 1, 0}}},
			"cards_created":         bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$eq": []string{"$action_type", "card_created"}}, 1, 0}}},
			"achievements_unlocked": bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$eq": []string{"$action_type", "achievement_unlocked"}}, 1, 0}}},
			"correct_answers":       bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$eq": []interface{}{"$is_correct", true}}, 1, 0}}},
			"total_answers":         bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$ne": []interface{}{"$is_correct", nil}}, 1, 0}}},
		}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	summary := &entities.StudyStatsSummary{}
	if len(results) > 0 {
		result := results[0]
		summary.TotalStudyTime = int(result["total_study_time"].(int32))
		summary.TotalSessions = int(result["total_sessions"].(int32))
		summary.TotalCards = int(result["total_cards"].(int32))
		summary.TotalXP = int(result["total_xp"].(int32))
		summary.DecksCreated = int(result["decks_created"].(int32))
		summary.CardsCreated = int(result["cards_created"].(int32))
		summary.AchievementsUnlocked = int(result["achievements_unlocked"].(int32))

		totalAnswers := int(result["total_answers"].(int32))
		correctAnswers := int(result["correct_answers"].(int32))
		if totalAnswers > 0 {
			summary.AverageAccuracy = float64(correctAnswers) / float64(totalAnswers) * 100
		}
	}

	// Buscar streak atual
	streak, err := r.getCurrentStreak(ctx, userID)
	if err == nil {
		summary.StudyStreak = streak
	}

	// Buscar nível atual
	level, err := r.getCurrentLevel(ctx, userID)
	if err == nil {
		summary.CurrentLevel = level
	}

	return summary, nil
}

// GetStudyStatsByPeriod retorna estatísticas agrupadas por período
func (r *StatsRepository) GetStudyStatsByPeriod(ctx context.Context, userID string, period string, days int) ([]entities.StudyStatsByPeriod, error) {
	collection := r.db.GetCollection("study_stats")

	startDate := time.Now().AddDate(0, 0, -days)

	var groupBy bson.M

	switch period {
	case "day":
		groupBy = bson.M{"year": "$year", "month": "$month", "day": bson.M{"$dayOfMonth": "$created_at"}}
	case "week":
		groupBy = bson.M{"year": "$year", "week": "$week"}
	case "month":
		groupBy = bson.M{"year": "$year", "month": "$month"}
	default:
		groupBy = bson.M{"year": "$year", "month": "$month", "day": bson.M{"$dayOfMonth": "$created_at"}}
	}

	pipeline := []bson.M{
		{"$match": bson.M{
			"user_id":    userID,
			"created_at": bson.M{"$gte": startDate},
		}},
		{"$group": bson.M{
			"_id":             groupBy,
			"study_time":      bson.M{"$sum": "$study_time"},
			"sessions":        bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$eq": []string{"$action_type", "study_session_start"}}, 1, 0}}},
			"cards_reviewed":  bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$eq": []string{"$action_type", "card_review"}}, 1, 0}}},
			"xp":              bson.M{"$sum": "$xp"},
			"correct_answers": bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$eq": []interface{}{"$is_correct", true}}, 1, 0}}},
			"total_answers":   bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$ne": []interface{}{"$is_correct", nil}}, 1, 0}}},
		}},
		{"$sort": bson.M{"_id": 1}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	var stats []entities.StudyStatsByPeriod
	for _, result := range results {
		id := result["_id"].(bson.M)
		studyTime := int(result["study_time"].(int32))
		sessions := int(result["sessions"].(int32))
		cardsReviewed := int(result["cards_reviewed"].(int32))
		xp := int(result["xp"].(int32))

		totalAnswers := int(result["total_answers"].(int32))
		correctAnswers := int(result["correct_answers"].(int32))
		accuracy := 0.0
		if totalAnswers > 0 {
			accuracy = float64(correctAnswers) / float64(totalAnswers) * 100
		}

		// Formatar data
		var dateStr string
		if period == "day" {
			dateStr = fmt.Sprintf("%d-%02d-%02d", id["year"], id["month"], id["day"])
		} else if period == "week" {
			dateStr = fmt.Sprintf("%d-W%02d", id["year"], id["week"])
		} else {
			dateStr = fmt.Sprintf("%d-%02d", id["year"], id["month"])
		}

		stats = append(stats, entities.StudyStatsByPeriod{
			Period:        period,
			Date:          dateStr,
			StudyTime:     studyTime,
			Sessions:      sessions,
			CardsReviewed: cardsReviewed,
			Accuracy:      accuracy,
			XP:            xp,
		})
	}

	return stats, nil
}

// GetPerformanceByDifficulty retorna performance por dificuldade
func (r *StatsRepository) GetPerformanceByDifficulty(ctx context.Context, userID string) ([]entities.PerformanceByDifficulty, error) {
	collection := r.db.GetCollection("study_stats")

	pipeline := []bson.M{
		{"$match": bson.M{
			"user_id":     userID,
			"action_type": "card_review",
			"difficulty":  bson.M{"$exists": true, "$ne": ""},
		}},
		{"$group": bson.M{
			"_id":        "$difficulty",
			"count":      bson.M{"$sum": 1},
			"total_time": bson.M{"$sum": "$study_time"},
		}},
		{"$sort": bson.M{"_id": 1}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	// Calcular total para porcentagens
	total := 0
	for _, result := range results {
		total += int(result["count"].(int32))
	}

	var performance []entities.PerformanceByDifficulty
	for _, result := range results {
		difficulty := result["_id"].(string)
		count := int(result["count"].(int32))
		totalTime := int(result["total_time"].(int32))

		percentage := 0.0
		if total > 0 {
			percentage = float64(count) / float64(total) * 100
		}

		averageTime := 0.0
		if count > 0 {
			averageTime = float64(totalTime) / float64(count)
		}

		performance = append(performance, entities.PerformanceByDifficulty{
			Difficulty:  difficulty,
			Count:       count,
			Percentage:  percentage,
			AverageTime: averageTime,
		})
	}

	return performance, nil
}

// GetDeckPerformance retorna performance por deck
func (r *StatsRepository) GetDeckPerformance(ctx context.Context, userID string) ([]entities.DeckPerformance, error) {
	collection := r.db.GetCollection("study_stats")

	pipeline := []bson.M{
		{"$match": bson.M{
			"user_id": userID,
			"deck_id": bson.M{"$exists": true, "$ne": ""},
		}},
		{"$group": bson.M{
			"_id":             "$deck_id",
			"study_time":      bson.M{"$sum": "$study_time"},
			"sessions":        bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$eq": []string{"$action_type", "study_session_start"}}, 1, 0}}},
			"cards_reviewed":  bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$eq": []string{"$action_type", "card_review"}}, 1, 0}}},
			"correct_answers": bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$eq": []interface{}{"$is_correct", true}}, 1, 0}}},
			"total_answers":   bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$ne": []interface{}{"$is_correct", nil}}, 1, 0}}},
			"last_studied":    bson.M{"$max": "$created_at"},
		}},
		{"$sort": bson.M{"last_studied": -1}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	var performance []entities.DeckPerformance
	for _, result := range results {
		deckID := result["_id"].(string)
		studyTime := int(result["study_time"].(int32))
		sessions := int(result["sessions"].(int32))
		cardsReviewed := int(result["cards_reviewed"].(int32))
		lastStudied := result["last_studied"].(primitive.DateTime).Time()

		totalAnswers := int(result["total_answers"].(int32))
		correctAnswers := int(result["correct_answers"].(int32))
		accuracy := 0.0
		if totalAnswers > 0 {
			accuracy = float64(correctAnswers) / float64(totalAnswers) * 100
		}

		// Buscar nome do deck
		deckName := deckID // fallback
		deckCollection := r.db.GetCollection("decks")
		var deck bson.M
		if err := deckCollection.FindOne(ctx, bson.M{"_id": deckID}).Decode(&deck); err == nil {
			if name, ok := deck["name"].(string); ok {
				deckName = name
			}
		}

		performance = append(performance, entities.DeckPerformance{
			DeckID:        deckID,
			DeckName:      deckName,
			StudyTime:     studyTime,
			Sessions:      sessions,
			CardsReviewed: cardsReviewed,
			Accuracy:      accuracy,
			LastStudied:   &lastStudied,
		})
	}

	return performance, nil
}

// getCurrentStreak calcula o streak atual do usuário
func (r *StatsRepository) getCurrentStreak(ctx context.Context, userID string) (int, error) {
	collection := r.db.GetCollection("study_stats")

	// Buscar a última entrada de streak
	opts := options.FindOne().SetSort(bson.M{"created_at": -1})
	var lastStats bson.M
	err := collection.FindOne(ctx, bson.M{"user_id": userID, "streak": bson.M{"$exists": true}}, opts).Decode(&lastStats)
	if err != nil {
		return 0, err
	}

	if streak, ok := lastStats["streak"].(int32); ok {
		return int(streak), nil
	}

	return 0, nil
}

// getCurrentLevel calcula o nível atual do usuário
func (r *StatsRepository) getCurrentLevel(ctx context.Context, userID string) (int, error) {
	collection := r.db.GetCollection("study_stats")

	// Buscar a última entrada de nível
	opts := options.FindOne().SetSort(bson.M{"created_at": -1})
	var lastStats bson.M
	err := collection.FindOne(ctx, bson.M{"user_id": userID, "level": bson.M{"$exists": true}}, opts).Decode(&lastStats)
	if err != nil {
		return 1, err // nível padrão
	}

	if level, ok := lastStats["level"].(int32); ok {
		return int(level), nil
	}

	return 1, nil
}

// GetTimeDistribution retorna a distribuição de estudo por período do dia
func (r *StatsRepository) GetTimeDistribution(ctx context.Context, userID string) (*entities.TimeDistribution, error) {
	collection := r.db.GetCollection("study_stats")

	pipeline := []bson.M{
		{"$match": bson.M{
			"user_id":     userID,
			"action_type": "card_review",
		}},
		{"$addFields": bson.M{
			"hour": bson.M{"$hour": "$created_at"},
		}},
		{"$group": bson.M{
			"_id": nil,
			"morning": bson.M{"$sum": bson.M{"$cond": []interface{}{
				bson.M{"$and": []bson.M{
					{"$gte": []interface{}{"$hour", 6}},
					{"$lt": []interface{}{"$hour", 12}},
				}},
				1, 0,
			}}},
			"afternoon": bson.M{"$sum": bson.M{"$cond": []interface{}{
				bson.M{"$and": []bson.M{
					{"$gte": []interface{}{"$hour", 12}},
					{"$lt": []interface{}{"$hour", 18}},
				}},
				1, 0,
			}}},
			"evening": bson.M{"$sum": bson.M{"$cond": []interface{}{
				bson.M{"$and": []bson.M{
					{"$gte": []interface{}{"$hour", 18}},
					{"$lt": []interface{}{"$hour", 24}},
				}},
				1, 0,
			}}},
			"night": bson.M{"$sum": bson.M{"$cond": []interface{}{
				bson.M{"$or": []bson.M{
					{"$lt": []interface{}{"$hour", 6}},
					{"$eq": []interface{}{"$hour", 24}},
				}},
				1, 0,
			}}},
			"total_study_time": bson.M{"$sum": "$study_time"},
			"longest_session":  bson.M{"$max": "$study_time"},
			"shortest_session": bson.M{"$min": "$study_time"},
			"total_sessions": bson.M{"$sum": bson.M{"$cond": []interface{}{
				bson.M{"$eq": []string{"$action_type", "study_session_end"}}, 1, 0,
			}}},
		}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	distribution := &entities.TimeDistribution{
		Morning:         0,
		Afternoon:       0,
		Evening:         0,
		Night:           0,
		TotalStudyTime:  0,
		LongestSession:  0,
		ShortestSession: 0,
		AverageTime:     0,
	}

	if len(results) > 0 {
		result := results[0]
		distribution.Morning = int(result["morning"].(int32))
		distribution.Afternoon = int(result["afternoon"].(int32))
		distribution.Evening = int(result["evening"].(int32))
		distribution.Night = int(result["night"].(int32))
		distribution.TotalStudyTime = int(result["total_study_time"].(int32))
		distribution.LongestSession = int(result["longest_session"].(int32))
		distribution.ShortestSession = int(result["shortest_session"].(int32))

		totalSessions := int(result["total_sessions"].(int32))
		if totalSessions > 0 {
			distribution.AverageTime = distribution.TotalStudyTime / totalSessions
		}
	}

	return distribution, nil
}
