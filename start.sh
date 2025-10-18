#!/bin/bash

echo "🚀 Starting TT Craft Demo Monorepo..."
echo ""

# Check if Docker is installed
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "📦 Docker detected. Would you like to use Docker? (y/n)"
    read -r use_docker
    
    if [[ $use_docker == "y" || $use_docker == "Y" ]]; then
        echo "🐳 Starting services with Docker..."
        docker-compose up --build
        exit 0
    fi
fi

echo "💻 Starting services locally..."
echo ""

# Check if PostgreSQL is running
echo "🗄️  Checking PostgreSQL connection..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Make sure PostgreSQL is running."
    echo "   You can start it with Docker: docker run -d -p 5432:5432 -e POSTGRES_USER=demo -e POSTGRES_PASSWORD=demo -e POSTGRES_DB=demo postgres:16"
    echo ""
fi

# Set database connection string
export DB_DSN="postgres://demo:demo@localhost:5432/demo?sslmode=disable"

# Start backend
echo "🔧 Starting Go backend on port 8080..."
cd backend
go run cmd/server/main.go &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "⚛️  Starting Next.js frontend on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Services started!"
echo ""
echo "📡 Backend API: http://localhost:8080"
echo "🌐 Frontend:    http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Wait for processes
wait
