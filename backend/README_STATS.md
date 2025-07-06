# Sistema de Estatísticas de Estudo

Este documento explica como usar o sistema de estatísticas implementado para gerar gráficos e relatórios detalhados de estudo.

## Visão Geral

O sistema de estatísticas captura todas as ações do usuário relacionadas ao estudo e armazena em uma tabela `study_stats` no MongoDB. Esses dados são usados para gerar:

- Gráficos de progresso detalhados
- Análise de performance
- Estatísticas por tempo de estudo
- Relatórios semanais e mensais

## Estrutura da Tabela

### Tabela: `study_stats`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `_id` | ObjectID | ID único do registro |
| `user_id` | String | ID do usuário |
| `deck_id` | String | ID do deck (opcional) |
| `card_id` | String | ID do card (opcional) |
| `action_type` | String | Tipo de ação: `study_session_start`, `study_session_end`, `card_review`, `deck_created`, `card_created`, `achievement_unlocked` |
| `difficulty` | String | Dificuldade: `easy`, `good`, `hard`, `again` |
| `is_correct` | Boolean | Se a resposta estava correta |
| `study_time` | Integer | Tempo de estudo em segundos |
| `session_id` | String | ID da sessão de estudo |
| `xp` | Integer | XP ganho |
| `streak` | Integer | Sequência atual |
| `level` | Integer | Nível atual |
| `metadata` | Object | Dados adicionais específicos da ação |
| `created_at` | Date | Data/hora da ação |
| `date` | Date | Data para agrupamento (sem hora) |
| `week` | Integer | Semana do ano |
| `month` | Integer | Mês do ano |
| `year` | Integer | Ano |

## Tipos de Ações Registradas

### 1. `study_session_start`
Registra o início de uma sessão de estudo.
```go
err := statsService.LogStudySessionStart(ctx, userID, sessionID, deckID)
```

### 2. `study_session_end`
Registra o fim de uma sessão de estudo.
```go
err := statsService.LogStudySessionEnd(ctx, userID, sessionID, studyTime, xp, streak, level)
```

### 3. `card_review`
Registra uma revisão de card.
```go
err := statsService.LogCardReview(ctx, userID, deckID, cardID, difficulty, isCorrect, studyTime, xp)
```

### 4. `deck_created`
Registra a criação de um deck.
```go
err := statsService.LogDeckCreated(ctx, userID, deckID, xp)
```

### 5. `card_created`
Registra a criação de um card.
```go
err := statsService.LogCardCreated(ctx, userID, deckID, cardID, xp)
```

### 6. `achievement_unlocked`
Registra o desbloqueio de uma conquista.
```go
err := statsService.LogAchievementUnlocked(ctx, userID, achievementID, xp)
```

## Endpoints da API

### 1. Resumo das Estatísticas
```
GET /api/stats/summary
```
Retorna um resumo geral das estatísticas do usuário.

### 2. Estatísticas por Período
```
GET /api/stats/period?period=day&days=30
```
Retorna estatísticas agrupadas por período (day, week, month).

### 3. Performance por Dificuldade
```
GET /api/stats/difficulty
```
Retorna performance agrupada por dificuldade dos cards.

### 4. Performance por Deck
```
GET /api/stats/decks
```
Retorna performance agrupada por deck.

### 5. Estatísticas Detalhadas
```
GET /api/stats/detailed
```
Retorna todas as estatísticas em uma única resposta.

## Integração nos Serviços

### Exemplo: Integração no Handler de Flashcards

```go
type Handler struct {
    service      *Service
    statsService *gamification.StatsService
}

func (h *Handler) CreateDeck(c *gin.Context) {
    userID := c.GetString("user_id")
    
    // Lógica de criação do deck...
    deck, err := h.service.CreateDeck(userID, name, description, tags)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Log da criação do deck
    err = h.statsService.LogDeckCreated(c.Request.Context(), userID, deck.ID.Hex(), 25)
    if err != nil {
        log.Printf("Failed to log deck creation: %v", err)
        // Não falhar a operação principal por causa do log
    }
    
    c.JSON(http.StatusCreated, deck)
}

func (h *Handler) CreateFlashcard(c *gin.Context) {
    userID := c.GetString("user_id")
    
    // Lógica de criação do card...
    card, err := h.service.CreateFlashcard(userID, deckID, question, answer, alternatives, correctAlternative, imageURL, audioURL, tags, difficulty)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Log da criação do card
    err = h.statsService.LogCardCreated(c.Request.Context(), userID, deckID, card.ID.Hex(), 10)
    if err != nil {
        log.Printf("Failed to log card creation: %v", err)
        // Não falhar a operação principal por causa do log
    }
    
    c.JSON(http.StatusCreated, card)
}

func (h *Handler) StartStudySession(c *gin.Context) {
    userID := c.GetString("user_id")
    
    // Lógica de início da sessão...
    session, err := h.service.StartStudySession(userID, deckID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Log do início da sessão
    err = h.statsService.LogStudySessionStart(c.Request.Context(), userID, session.ID.Hex(), deckID)
    if err != nil {
        log.Printf("Failed to log study session start: %v", err)
        // Não falhar a operação principal por causa do log
    }
    
    c.JSON(http.StatusCreated, session)
}

func (h *Handler) EndStudySession(c *gin.Context) {
    userID := c.GetString("user_id")
    
    // Lógica de fim da sessão...
    err := h.service.EndStudySession(sessionID, cardsReviewed, score)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Log do fim da sessão
    err = h.statsService.LogStudySessionEnd(c.Request.Context(), userID, sessionID, studyTime, xp, streak, level)
    if err != nil {
        log.Printf("Failed to log study session end: %v", err)
        // Não falhar a operação principal por causa do log
    }
    
    c.JSON(http.StatusOK, gin.H{"message": "Session ended"})
}
```

## Exemplos de Consultas

### 1. Resumo das Estatísticas
```javascript
// Frontend
const response = await fetch('/api/stats/summary', {
    headers: {
        'X-Auth-Token': token
    }
});
const summary = await response.json();

console.log('Total study time:', summary.total_study_time);
console.log('Total sessions:', summary.total_sessions);
console.log('Average accuracy:', summary.average_accuracy);
console.log('Current level:', summary.current_level);
```

### 2. Estatísticas Semanais
```javascript
const response = await fetch('/api/stats/period?period=day&days=7', {
    headers: {
        'X-Auth-Token': token
    }
});
const weeklyStats = await response.json();

// Usar para gráfico de linha
weeklyStats.forEach(day => {
    console.log(`${day.date}: ${day.study_time} seconds, ${day.accuracy}% accuracy`);
});
```

### 3. Performance por Dificuldade
```javascript
const response = await fetch('/api/stats/difficulty', {
    headers: {
        'X-Auth-Token': token
    }
});
const difficultyStats = await response.json();

// Usar para gráfico de pizza
difficultyStats.forEach(diff => {
    console.log(`${diff.difficulty}: ${diff.percentage}% (${diff.count} cards)`);
});
```

### 4. Performance por Deck
```javascript
const response = await fetch('/api/stats/decks', {
    headers: {
        'X-Auth-Token': token
    }
});
const deckStats = await response.json();

// Usar para gráfico de barras
deckStats.forEach(deck => {
    console.log(`${deck.deck_name}: ${deck.accuracy}% accuracy, ${deck.study_time} seconds`);
});
```

## Índices do MongoDB

Os seguintes índices são criados automaticamente para otimizar as consultas:

1. `user_id_created_at`: Para consultas por usuário e data
2. `user_id_action_type_created_at`: Para consultas por tipo de ação
3. `user_id_deck_id_created_at`: Para performance por deck
4. `user_id_date`: Para agrupamentos por data

## Considerações de Performance

1. **Logging Assíncrono**: O logging de estatísticas não deve bloquear as operações principais
2. **Índices**: Os índices são essenciais para consultas rápidas
3. **Agregação**: Use pipelines de agregação do MongoDB para cálculos complexos
4. **Cache**: Considere cachear estatísticas frequentemente acessadas

## Próximos Passos

1. Integrar o logging nos handlers existentes
2. Criar gráficos no frontend usando as estatísticas
3. Implementar relatórios semanais/mensais
4. Adicionar notificações baseadas em estatísticas
5. Implementar gamificação baseada em performance 