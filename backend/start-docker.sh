#!/bin/bash

echo "🚀 Starting Flashcard Backend with Docker Compose..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if backend is responding
echo "🔍 Checking if backend is responding..."
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "✅ Backend is running successfully!"
        echo "🌐 Backend URL: http://localhost:3000"
        echo "📊 Health check: http://localhost:3000/health"
        echo "📚 API endpoints: http://localhost:3000/api/decks"
        echo ""
        echo "📋 Useful commands:"
        echo "  - View logs: docker-compose logs -f backend"
        echo "  - Stop services: docker-compose down"
        echo "  - Restart services: docker-compose restart"
        exit 0
    fi
    echo "⏳ Waiting for backend to start... (attempt $i/30)"
    sleep 2
done

echo "❌ Backend failed to start. Check logs with: docker-compose logs backend"
exit 1 