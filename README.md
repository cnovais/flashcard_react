# Flashcard App - Projeto Completo

Aplicativo de flashcards com gamificação, autenticação social e recursos premium.

## 🏗️ Arquitetura

### Backend (Go + Clean Architecture)
- **Linguagem**: Go 1.21+
- **Framework**: Gin (HTTP)
- **Banco**: MongoDB
- **Autenticação**: JWT + OAuth2 (Google/LinkedIn)
- **Upload**: AWS S3
- **Pagamentos**: Stripe
- **Arquitetura**: Clean Architecture

### Frontend (React Native + Expo)
- **Framework**: React Native + Expo
- **Navegação**: React Navigation
- **UI**: React Native Paper
- **Estado**: Context API
- **Autenticação**: Expo AuthSession
- **Gamificação**: Sistema próprio

## 🚀 Funcionalidades Implementadas

### ✅ Backend
- [x] **Testes Unitários**: Testes para serviços de autenticação
- [x] **Upload de Arquivos**: Imagens e áudio via AWS S3
- [x] **Gamificação**: Sistema de XP, streaks e conquistas
- [x] **Stripe Integration**: Pagamentos e assinaturas
- [x] **Autenticação OAuth2**: Google e LinkedIn
- [x] **CRUD Completo**: Decks, flashcards, usuários
- [x] **Sistema de Planos**: Free/Premium com limites

### ✅ Frontend
- [x] **Autenticação Social**: Login Google/LinkedIn
- [x] **Consumo de APIs**: Serviços para todos os endpoints
- [x] **CRUD de Decks**: Listagem, criação, edição, exclusão
- [x] **Gamificação**: Perfil com XP, nível, conquistas
- [x] **Recursos Premium**: Interface para upgrade
- [x] **Tema Escuro**: Toggle entre temas

## 📁 Estrutura do Projeto

```
flashcard_react/
├── backend/                    # Backend Go
│   ├── cmd/main.go            # Entry point
│   ├── internal/
│   │   ├── config/            # Configurações
│   │   ├── domain/            # Entidades
│   │   ├── infrastructure/    # DB, Auth, Middlewares
│   │   └── modules/           # Módulos da aplicação
│   │       ├── auth/          # Autenticação
│   │       ├── flashcards/    # Decks e Cards
│   │       ├── plans/         # Planos e Limites
│   │       ├── upload/        # Upload de arquivos
│   │       ├── gamification/  # XP, Conquistas
│   │       └── payments/      # Stripe
│   ├── tests/                 # Testes unitários
│   └── env.example           # Variáveis de ambiente
├── frontend/                   # App React Native
│   ├── src/
│   │   ├── contexts/          # Context API
│   │   ├── services/          # Serviços de API
│   │   ├── screens/           # Telas do app
│   │   ├── navigation/        # Navegação
│   │   └── theme/             # Temas
│   ├── App.tsx               # Componente principal
│   └── package.json          # Dependências
└── README.md                 # Este arquivo
```

## 🛠️ Configuração e Instalação

### Backend

1. **Instalar dependências**:
```bash
cd backend
go mod download
```

2. **Configurar variáveis de ambiente**:
```bash
cp env.example .env
# Editar .env com suas configurações
```

3. **Executar**:
```bash
go run cmd/main.go
```

### Frontend

1. **Instalar dependências**:
```bash
cd frontend
npm install
```

2. **Configurar variáveis de ambiente**:
```bash
# Criar .env com:
EXPO_PUBLIC_API_URL=http://localhost:8080
```

3. **Executar**:
```bash
npm start
```

## 🔧 Variáveis de Ambiente

### Backend (.env)
```env
# Server
PORT=8080
HOST=localhost

# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_NAME=flashcard_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=24

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
OAUTH_REDIRECT_URL=http://localhost:8080/auth/callback

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:8080
```

## 📱 Funcionalidades do App

### Autenticação
- Login com Google OAuth2
- Login com LinkedIn OAuth2
- Tokens JWT automáticos
- Logout seguro

### Decks (Baralhos)
- Criar decks com nome, descrição e tags
- Listar decks com busca
- Editar informações do deck
- Excluir decks
- Limites por plano (Free: 3 decks)

### Flashcards
- Criar cards com texto, imagem e áudio
- Editar cards existentes
- Excluir cards
- Limites por plano (Free: 60 cards/deck)

### Gamificação
- Sistema de XP (25 XP por deck, 10 XP por card)
- Níveis baseados em XP (100 XP por nível)
- Streaks de estudo
- Conquistas desbloqueáveis
- Perfil com estatísticas

### Recursos Premium
- Interface para upgrade de plano
- Destaque de recursos premium
- Integração preparada para Stripe

## 🔌 Endpoints da API

### Autenticação
- `GET /health` - Health check
- `GET /auth/urls` - URLs de autenticação
- `GET /auth/google?code=...` - Login Google
- `GET /auth/linkedin?code=...` - Login LinkedIn

### Usuário
- `PUT /api/user/avatar` - Atualizar avatar

### Decks
- `GET /api/decks` - Listar decks
- `POST /api/decks` - Criar deck
- `GET /api/decks/:id` - Obter deck
- `PUT /api/decks/:id` - Atualizar deck
- `DELETE /api/decks/:id` - Excluir deck

### Flashcards
- `GET /api/cards/deck/:deckId` - Listar cards
- `POST /api/cards` - Criar card
- `PUT /api/cards/:id` - Atualizar card
- `DELETE /api/cards/:id` - Excluir card

### Upload
- `POST /api/upload/image` - Upload de imagem
- `POST /api/upload/audio` - Upload de áudio
- `DELETE /api/upload` - Excluir arquivo

### Planos
- `GET /api/plans` - Listar planos
- `GET /api/plans/user` - Plano do usuário
- `POST /api/plans/upgrade` - Fazer upgrade
- `GET /api/plans/limits` - Limites do usuário

## 🎮 Sistema de Gamificação

### Conquistas Disponíveis
- 🎯 **Primeiro Deck**: Criar primeiro deck
- 📝 **Primeiro Card**: Criar primeiro flashcard
- 🔥 **Semana de Estudos**: Estudar 7 dias seguidos
- 🏆 **Mês de Dedicação**: Estudar 30 dias seguidos
- ⭐ **Aprendiz**: Alcançar nível 10

### XP por Ação
- Criar deck: 25 XP
- Criar card: 10 XP
- Completar sessão de estudo: 5-20 XP
- Manter streak: 5 XP/dia

## 💳 Sistema de Planos

### Plano Gratuito
- 3 decks máximo
- 60 cards por deck
- Funcionalidades básicas

### Plano Premium
- Decks ilimitados
- Cards ilimitados
- Cores e bordas personalizadas
- Fotos de fundo
- Estatísticas avançadas

## 🧪 Testes

### Backend
```bash
cd backend
go test ./...
```

### Frontend
```bash
cd frontend
npm test
```

## 🚀 Deploy

### Backend
```bash
# Build
go build -o main cmd/main.go

# Docker (opcional)
docker build -t flashcard-backend .
docker run -p 8080:8080 flashcard-backend
```

### Frontend
```bash
# Build para produção
expo build:android
expo build:ios

# Ou EAS Build
eas build --platform all
```

## 📈 Próximos Passos

### Backend
- [ ] Testes de integração
- [ ] Cache com Redis
- [ ] Logs estruturados
- [ ] Métricas e monitoramento
- [ ] Documentação Swagger

### Frontend
- [ ] Testes unitários
- [ ] Testes E2E
- [ ] PWA (Progressive Web App)
- [ ] Offline mode
- [ ] Push notifications

### Geral
- [ ] CI/CD pipeline
- [ ] Docker Compose
- [ ] Kubernetes deployment
- [ ] Internacionalização (i18n)
- [ ] Analytics

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, abra uma issue no repositório. 