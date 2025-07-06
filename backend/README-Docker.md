# Flashcard Backend - Docker Setup

Este documento explica como executar o backend do Flashcard usando Docker.

## 📋 Pré-requisitos

- Docker Desktop instalado e rodando
- Docker Compose instalado
- Porta 3000 disponível

## 🚀 Início Rápido

### Opção 1: Script Automático (Recomendado)

```bash
# Na pasta backend
./start-docker.sh
```

### Opção 2: Comandos Manuais

```bash
# Na pasta backend
docker-compose up --build -d
```

## 📊 Verificar Status

```bash
# Verificar se os containers estão rodando
docker-compose ps

# Ver logs do backend
docker-compose logs -f backend

# Ver logs do MongoDB
docker-compose logs -f mongo
```

## 🔍 Testar a API

```bash
# Health check
curl http://localhost:3000/health

# Listar decks
curl http://localhost:3000/api/decks

# Testar rotas de gamificação
curl http://localhost:3000/api/gamification/stats
curl http://localhost:3000/api/gamification/badges
curl http://localhost:3000/api/gamification/achievements
curl http://localhost:3000/api/gamification/leaderboard
curl http://localhost:3000/api/gamification/weekly-challenges
```

## 🛑 Parar Serviços

```bash
# Parar e remover containers
docker-compose down

# Parar e remover containers + volumes (cuidado: apaga dados do MongoDB)
docker-compose down -v
```

## 🔧 Comandos Úteis

```bash
# Rebuild e restart
docker-compose up --build -d

# Restart apenas o backend
docker-compose restart backend

# Acessar shell do container backend
docker-compose exec backend sh

# Acessar MongoDB
docker-compose exec mongo mongosh flashcard_db
```

## 📁 Estrutura de Arquivos

```
backend/
├── docker-compose.yml    # Configuração dos serviços
├── Dockerfile           # Build da imagem do backend
├── .dockerignore        # Arquivos ignorados no build
├── mongo-init.js        # Script de inicialização do MongoDB
├── start-docker.sh      # Script de inicialização automática
└── README-Docker.md     # Este arquivo
```

## 🌐 URLs dos Serviços

- **Backend API**: http://localhost:3000
- **MongoDB**: localhost:27017
- **Health Check**: http://localhost:3000/health

## 🔒 Variáveis de Ambiente

As variáveis de ambiente estão configuradas no `docker-compose.yml`. Para produção, crie um arquivo `.env` com valores reais:

```bash
# Exemplo de .env
MONGODB_URI=mongodb://mongo:27017/flashcard_db
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# ... outras variáveis
```

## 🐛 Troubleshooting

### Porta 3000 já em uso
```bash
# Verificar o que está usando a porta
lsof -i :3000

# Matar o processo
kill -9 <PID>
```

### Container não inicia
```bash
# Ver logs detalhados
docker-compose logs backend

# Rebuild completo
docker-compose down
docker-compose up --build
```

### MongoDB não conecta
```bash
# Verificar se o MongoDB está rodando
docker-compose ps mongo

# Ver logs do MongoDB
docker-compose logs mongo
```

## 📈 Monitoramento

```bash
# Ver uso de recursos
docker stats

# Ver logs em tempo real
docker-compose logs -f
``` 