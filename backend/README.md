# Flashcard Backend

Backend em Go com Clean Architecture para o sistema de flashcards.

## Estrutura do Projeto

```
backend/
├── cmd/
│   └── main.go                 # Ponto de entrada da aplicação
├── internal/
│   ├── config/
│   │   └── config.go           # Configurações da aplicação
│   ├── domain/
│   │   └── entities/           # Entidades do domínio
│   │       ├── user.go
│   │       ├── deck.go
│   │       ├── flashcard.go
│   │       └── plan.go
│   ├── infrastructure/
│   │   ├── auth/
│   │   │   └── jwt.go          # Sistema de JWT
│   │   ├── database/
│   │   │   └── mongo.go        # Conexão com MongoDB
│   │   └── server/
│   │       ├── middleware/     # Middlewares HTTP
│   │       │   ├── auth.go
│   │       │   ├── cors.go
│   │       │   ├── logger.go
│   │       │   └── recovery.go
│   │       └── routes.go       # Configuração de rotas
│   └── modules/
│       ├── auth/               # Módulo de autenticação
│       │   ├── handler.go
│       │   ├── repository.go
│       │   ├── service.go
│       │   └── module.go
│       ├── flashcards/         # Módulo de flashcards
│       │   ├── handler.go
│       │   ├── repository.go
│       │   ├── service.go
│       │   └── module.go
│       └── plans/              # Módulo de planos
│           ├── handler.go
│           ├── repository.go
│           ├── service.go
│           └── module.go
├── go.mod                      # Dependências Go
├── env.example                 # Exemplo de variáveis de ambiente
└── README.md                   # Este arquivo
```

## Funcionalidades

### Autenticação
- Login via Google OAuth2
- Login via LinkedIn OAuth2
- Geração de tokens JWT
- Middleware de autenticação

### Flashcards
- CRUD de decks (baralhos)
- CRUD de flashcards
- Suporte a texto, imagem e áudio
- Sistema de tags
- Limites por plano (free: 3 decks, 60 cards por deck)

### Planos
- Sistema de planos (free/premium)
- Controle de limites por usuário
- Upgrade/downgrade de planos

### Gamificação
- Sessões de estudo
- Histórico de estudos
- Sistema de XP e streaks (preparado)

## Configuração

1. Clone o repositório
2. Instale as dependências:
   ```bash
   go mod download
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. Certifique-se de que o MongoDB está rodando

5. Execute o servidor:
   ```bash
   go run cmd/main.go
   ```

## Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 8080)
- `HOST`: Host do servidor (padrão: localhost)
- `MONGODB_URI`: URI de conexão com MongoDB
- `MONGODB_NAME`: Nome do banco de dados
- `JWT_SECRET`: Chave secreta para JWT
- `JWT_EXPIRY`: Tempo de expiração do JWT em horas
- `GOOGLE_CLIENT_ID`: Client ID do Google OAuth
- `GOOGLE_CLIENT_SECRET`: Client Secret do Google OAuth
- `LINKEDIN_CLIENT_ID`: Client ID do LinkedIn OAuth
- `LINKEDIN_CLIENT_SECRET`: Client Secret do LinkedIn OAuth
- `OAUTH_REDIRECT_URL`: URL de redirecionamento OAuth

## Endpoints da API

### Autenticação (Público)
- `GET /health` - Health check
- `GET /auth/urls` - URLs de autenticação OAuth
- `GET /auth/google?code=...` - Login com Google
- `GET /auth/linkedin?code=...` - Login com LinkedIn

### Usuário (Protegido)
- `PUT /api/user/avatar` - Atualizar avatar

### Decks (Protegido)
- `POST /api/decks/` - Criar deck
- `GET /api/decks/` - Listar decks do usuário
- `GET /api/decks/:id` - Obter deck específico
- `PUT /api/decks/:id` - Atualizar deck
- `DELETE /api/decks/:id` - Deletar deck

### Flashcards (Protegido)
- `POST /api/cards/` - Criar flashcard
- `GET /api/cards/deck/:deckId` - Listar flashcards de um deck
- `PUT /api/cards/:id` - Atualizar flashcard
- `DELETE /api/cards/:id` - Deletar flashcard

### Estudo (Protegido)
- `POST /api/study/start` - Iniciar sessão de estudo
- `PUT /api/study/:id/end` - Finalizar sessão de estudo
- `GET /api/study/history` - Histórico de estudos

### Planos (Protegido)
- `GET /api/plans/` - Listar todos os planos
- `GET /api/plans/user` - Obter plano do usuário
- `POST /api/plans/upgrade` - Fazer upgrade do plano
- `POST /api/plans/downgrade` - Fazer downgrade para free
- `GET /api/plans/limits` - Obter limites do usuário

## Autenticação

Para acessar endpoints protegidos, inclua o header:
```
Authorization: Bearer <jwt-token>
```

## Desenvolvimento

### Estrutura Clean Architecture

O projeto segue os princípios da Clean Architecture:

1. **Domain Layer**: Entidades e regras de negócio
2. **Use Case Layer**: Casos de uso da aplicação (Services)
3. **Interface Layer**: Controllers e apresentação (Handlers)
4. **Infrastructure Layer**: Banco de dados, frameworks, etc.

### Adicionando Novos Módulos

1. Crie a estrutura de pastas em `internal/modules/`
2. Implemente Repository, Service e Handler
3. Adicione as rotas em `internal/infrastructure/server/routes.go`
4. Registre o módulo em `cmd/main.go`

## Próximos Passos

- [ ] Implementar sistema de gamificação completo
- [ ] Adicionar upload de imagens e áudio
- [ ] Implementar sistema de pagamentos
- [ ] Adicionar testes unitários e de integração
- [ ] Configurar CI/CD
- [ ] Adicionar documentação da API (Swagger)
- [ ] Implementar cache (Redis)
- [ ] Adicionar logs estruturados 