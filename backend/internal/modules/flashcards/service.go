package flashcards

import (
	"context"
	"fmt"

	"flashcard-backend/internal/config"
	"flashcard-backend/internal/domain/entities"
	"flashcard-backend/internal/modules/admin"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Service struct {
	repo         *MongoRepository
	cfg          *config.Config
	adminService interface {
		ValidateDeckLimit(ctx context.Context, userPlan string, currentDeckCount int, isPublic bool) error
		ValidateCardLimit(ctx context.Context, userPlan string, currentCardCount int) error
		ValidatePublicDeckLimit(ctx context.Context, userPlan string, currentPublicDeckCount int) error
		ValidatePublicCardLimit(ctx context.Context, userPlan string, currentPublicCardCount int) error
	}
	authService interface {
		GetUserByID(userID string) (*entities.User, error)
	}
}

func NewService(repo *MongoRepository, cfg *config.Config, adminService interface {
	ValidateDeckLimit(ctx context.Context, userPlan string, currentDeckCount int, isPublic bool) error
	ValidateCardLimit(ctx context.Context, userPlan string, currentCardCount int) error
	ValidatePublicDeckLimit(ctx context.Context, userPlan string, currentPublicDeckCount int) error
	ValidatePublicCardLimit(ctx context.Context, userPlan string, currentPublicCardCount int) error
}, authService interface {
	GetUserByID(userID string) (*entities.User, error)
}) *Service {
	return &Service{
		repo:         repo,
		cfg:          cfg,
		adminService: adminService,
		authService:  authService,
	}
}

// Deck operations
func (s *Service) CreateDeck(userID string, name, description string, tags []string, isPublic bool) (*entities.Deck, error) {
	fmt.Printf("🔍 CREATE DECK - Iniciando criação de deck\n")
	fmt.Printf("🔍 CREATE DECK - userID: %s\n", userID)
	fmt.Printf("🔍 CREATE DECK - name: %s\n", name)
	fmt.Printf("🔍 CREATE DECK - isPublic: %v\n", isPublic)

	// removido deckCount não utilizado

	decks, _ := s.repo.GetDecksByUserEmail(userID)
	fmt.Printf("🔍 CREATE DECK - Total de decks encontrados: %d\n", len(decks))

	userPlan := "free"

	// BYPASS: Se email do usuário está em AdminEmails, ignora limites
	if s.authService != nil && s.adminService != nil {
		user, err := s.authService.GetUserByID(userID)
		if err == nil && user != nil {
			adminConfig, err := s.adminService.(*admin.Service).GetConfig(context.Background())
			if err == nil && adminConfig != nil {
				for _, adminEmail := range adminConfig.AdminEmails {
					if user.Email == adminEmail {
						fmt.Printf("🔍 CREATE DECK - Usuário é admin, ignorando limites\n")
						// Ignora limites
						deck := &entities.Deck{
							Name:        name,
							Description: description,
							Tags:        tags,
							IsPublic:    isPublic,
						}
						if err := s.repo.CreateDeckWithStringUserID(deck, userID); err != nil {
							return nil, fmt.Errorf("failed to create deck: %w", err)
						}
						return deck, nil
					}
				}
			}
		}
	}

	// Corrigido: contar sempre ambos os tipos e validar o limite correto
	privateCount := 0
	publicCount := 0
	for _, d := range decks {
		fmt.Printf("🔍 CREATE DECK - Deck: %s, IsPublic: %v\n", d.Name, d.IsPublic)
		if d.IsPublic {
			publicCount++
		} else {
			privateCount++
		}
	}

	fmt.Printf("🔍 CREATE DECK - Contagem: %d privados, %d públicos\n", privateCount, publicCount)
	deckType := "PRIVADO"
	if isPublic {
		deckType = "PÚBLICO"
	}
	fmt.Printf("🔍 CREATE DECK - Tentando criar deck %s\n", deckType)

	if s.adminService != nil {
		if isPublic {
			fmt.Printf("🔍 CREATE DECK - Validando limite de decks públicos (%d)\n", publicCount)
			if err := s.adminService.ValidateDeckLimit(context.Background(), userPlan, publicCount, true); err != nil {
				fmt.Printf("🔍 CREATE DECK - ERRO na validação de público: %v\n", err)
				return nil, err
			}
		} else {
			fmt.Printf("🔍 CREATE DECK - Validando limite de decks privados (%d)\n", privateCount)
			if err := s.adminService.ValidateDeckLimit(context.Background(), userPlan, privateCount, false); err != nil {
				fmt.Printf("🔍 CREATE DECK - ERRO na validação de privado: %v\n", err)
				return nil, err
			}
		}
	}

	fmt.Printf("🔍 CREATE DECK - Validação passou, criando deck\n")

	deck := &entities.Deck{
		Name:        name,
		Description: description,
		Tags:        tags,
		IsPublic:    isPublic,
	}

	if err := s.repo.CreateDeckWithStringUserID(deck, userID); err != nil {
		return nil, fmt.Errorf("failed to create deck: %w", err)
	}

	fmt.Printf("🔍 CREATE DECK - Deck criado com sucesso\n")
	return deck, nil
}

func (s *Service) GetDecksByUserID(userID string) ([]entities.Deck, error) {
	var decks []entities.Deck
	var err error

	// Tenta buscar por ObjectId
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err == nil {
		decks, _ = s.repo.GetDecksByUserID(userObjectID)
	}

	// Se não encontrou, tenta buscar por string (email)
	if len(decks) == 0 {
		decks, err = s.repo.GetDecksByUserEmail(userID)
		if err != nil {
			return nil, fmt.Errorf("failed to get decks: %w", err)
		}
	}

	// Para cada deck, calcular o cardCount real
	for i := range decks {
		fmt.Printf("Calculando cardCount para deck %s (%s)\n", decks[i].ID.Hex(), decks[i].Name)
		count, err := s.repo.CountCardsByDeckIDString(decks[i].ID.Hex())
		if err != nil {
			fmt.Printf("Erro ao contar cards para deck %s: %v\n", decks[i].ID.Hex(), err)
			count = 0
		}
		fmt.Printf("Deck %s tem %d cards\n", decks[i].Name, count)
		decks[i].CardCount = int(count)
	}

	if decks == nil {
		decks = []entities.Deck{}
	}

	return decks, nil
}

func (s *Service) GetDeckByID(deckID string) (*entities.Deck, error) {
	deckObjectID, err := primitive.ObjectIDFromHex(deckID)
	if err != nil {
		return nil, fmt.Errorf("invalid deck ID: %w", err)
	}

	return s.repo.GetDeckByID(deckObjectID)
}

func (s *Service) UpdateDeck(deckID string, name, description string, tags []string, color, border, background string, isPublic bool) (*entities.Deck, error) {
	deckObjectID, err := primitive.ObjectIDFromHex(deckID)
	if err != nil {
		return nil, fmt.Errorf("invalid deck ID: %w", err)
	}

	deck, err := s.repo.GetDeckByID(deckObjectID)
	if err != nil {
		return nil, fmt.Errorf("deck not found: %w", err)
	}

	deck.Name = name
	deck.Description = description
	deck.Tags = tags
	deck.Color = color
	deck.Border = border
	deck.Background = background
	deck.IsPublic = isPublic

	if err := s.repo.UpdateDeck(deck); err != nil {
		return nil, fmt.Errorf("failed to update deck: %w", err)
	}

	return deck, nil
}

func (s *Service) DeleteDeck(deckID string) error {
	deckObjectID, err := primitive.ObjectIDFromHex(deckID)
	if err != nil {
		return fmt.Errorf("invalid deck ID: %w", err)
	}

	return s.repo.DeleteDeck(deckObjectID)
}

// Flashcard operations
func (s *Service) CreateFlashcard(userID, deckID, question, answer string, alternatives []string, correctAlternative *int, imageURL, audioURL string, tags []string, difficulty int) (*entities.Flashcard, error) {
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// BYPASS: Se email do usuário está em AdminEmails, ignora limites
	if s.authService != nil && s.adminService != nil {
		user, err := s.authService.GetUserByID(userID)
		if err == nil && user != nil {
			adminConfig, err := s.adminService.(*admin.Service).GetConfig(context.Background())
			if err == nil && adminConfig != nil {
				for _, adminEmail := range adminConfig.AdminEmails {
					if user.Email == adminEmail {
						card := &entities.Flashcard{
							DeckID:             deckID,
							UserID:             userObjectID,
							Question:           question,
							Answer:             answer,
							Alternatives:       alternatives,
							CorrectAlternative: correctAlternative,
							ImageURL:           &imageURL,
							AudioURL:           &audioURL,
							Tags:               tags,
							Difficulty:         difficulty,
						}
						if err := s.repo.CreateFlashcard(card); err != nil {
							return nil, fmt.Errorf("failed to create flashcard: %w", err)
						}
						return card, nil
					}
				}
			}
		}
	}

	// Check card limit for free users
	cardCount, err := s.repo.CountCardsByDeckIDString(deckID)
	if err != nil {
		return nil, fmt.Errorf("failed to count cards: %w", err)
	}

	// TODO: Get user plan from plans service
	// For now, assume free plan
	userPlan := "free"

	// Validate card limit using admin service
	if s.adminService != nil {
		if err := s.adminService.ValidateCardLimit(context.Background(), userPlan, int(cardCount)); err != nil {
			return nil, err
		}
	}

	card := &entities.Flashcard{
		DeckID:             deckID,
		UserID:             userObjectID,
		Question:           question,
		Answer:             answer,
		Alternatives:       alternatives,
		CorrectAlternative: correctAlternative,
		ImageURL:           &imageURL,
		AudioURL:           &audioURL,
		Tags:               tags,
		Difficulty:         difficulty,
	}

	if err := s.repo.CreateFlashcard(card); err != nil {
		return nil, fmt.Errorf("failed to create flashcard: %w", err)
	}

	return card, nil
}

func (s *Service) GetFlashcardsByDeckID(deckID string) ([]entities.Flashcard, error) {
	return s.repo.GetFlashcardsByDeckIDString(deckID)
}

func (s *Service) UpdateFlashcard(cardID, question, answer string, alternatives []string, correctAlternative *int, imageURL, audioURL string, tags []string, difficulty int) (*entities.Flashcard, error) {
	ctx := context.Background()
	card, err := s.repo.GetByID(ctx, cardID)
	if err != nil {
		return nil, fmt.Errorf("flashcard not found: %w", err)
	}

	card.Question = question
	card.Answer = answer
	card.Alternatives = alternatives
	card.CorrectAlternative = correctAlternative
	card.ImageURL = &imageURL
	card.AudioURL = &audioURL
	card.Tags = tags
	card.Difficulty = difficulty

	if err := s.repo.Update(ctx, card); err != nil {
		return nil, fmt.Errorf("failed to update flashcard: %w", err)
	}

	return card, nil
}

func (s *Service) DeleteFlashcard(cardID string) error {
	ctx := context.Background()
	return s.repo.Delete(ctx, cardID)
}

// Study session operations
func (s *Service) StartStudySession(userID, deckID string) (*entities.StudySession, error) {
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	deckObjectID, err := primitive.ObjectIDFromHex(deckID)
	if err != nil {
		return nil, fmt.Errorf("invalid deck ID: %w", err)
	}

	session := &entities.StudySession{
		UserID: userObjectID,
		DeckID: deckObjectID,
	}

	if err := s.repo.CreateStudySession(session); err != nil {
		return nil, fmt.Errorf("failed to create study session: %w", err)
	}

	return session, nil
}

func (s *Service) EndStudySession(sessionID string, cardsReviewed int, score float64) error {
	sessionObjectID, err := primitive.ObjectIDFromHex(sessionID)
	if err != nil {
		return fmt.Errorf("invalid session ID: %w", err)
	}

	session := &entities.StudySession{
		ID:            sessionObjectID,
		CardsReviewed: cardsReviewed,
		Score:         score,
	}

	return s.repo.UpdateStudySession(session)
}

func (s *Service) GetStudyHistory(userID string, limit int64) ([]entities.StudySession, error) {
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	return s.repo.GetStudySessionsByUserID(userObjectID, limit)
}

// Novo: Listagem de decks com filtro de visibilidade e busca
func (s *Service) GetDecksByUserIDWithFilter(userID, visibility, search string) ([]entities.Deck, error) {
	var decks []entities.Deck
	var err error

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err == nil {
		decks, _ = s.repo.GetDecksByUserIDWithFilter(userObjectID, visibility, search)
	}

	if len(decks) == 0 {
		decks, err = s.repo.GetDecksByUserEmailWithFilter(userID, visibility, search)
		if err != nil {
			return nil, fmt.Errorf("failed to get decks: %w", err)
		}
	}

	for i := range decks {
		count, err := s.repo.CountCardsByDeckIDString(decks[i].ID.Hex())
		if err != nil {
			count = 0
		}
		decks[i].CardCount = int(count)
	}

	if decks == nil {
		decks = []entities.Deck{}
	}

	return decks, nil
}
