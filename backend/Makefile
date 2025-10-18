.PHONY: help migrate-up migrate-down migrate-create migrate-force migrate-version seed seed-clear run build test clean docker-build docker-run

# Default target
help:
	@echo "Available commands:"
	@echo "  make run              - Run the application locally"
	@echo "  make build            - Build the application binary"
	@echo "  make test             - Run tests"
	@echo ""
	@echo "Database Migrations:"
	@echo "  make migrate-up       - Apply all pending migrations"
	@echo "  make migrate-down     - Rollback last migration"
	@echo "  make migrate-create   - Create a new migration (NAME=<migration_name>)"
	@echo "  make migrate-force    - Force migration version (VERSION=<version>)"
	@echo "  make migrate-version  - Show current migration version"
	@echo ""
	@echo "Demo Data:"
	@echo "  make seed             - Seed demo data into database"
	@echo "  make seed-clear       - Clear all data and re-seed"
	@echo "  make seed-list        - List all seeded returns"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build     - Build Docker image"
	@echo "  make docker-run       - Run with docker-compose"
	@echo "  make docker-seed      - Seed data in running Docker container"
	@echo ""
	@echo "  make clean            - Clean build artifacts"

# Database configuration
DB_DSN ?= postgres://demo:demo@localhost:5432/demo?sslmode=disable
MIGRATIONS_DIR = ./migrations

# Install migrate CLI if not present
install-migrate:
	@which migrate > /dev/null || \
		(echo "Installing golang-migrate..." && \
		go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest)

# Run all pending migrations
migrate-up: install-migrate
	@echo "Applying migrations..."
	@migrate -path $(MIGRATIONS_DIR) -database "$(DB_DSN)" up
	@echo "Migrations applied successfully!"

# Rollback last migration
migrate-down: install-migrate
	@echo "Rolling back last migration..."
	@migrate -path $(MIGRATIONS_DIR) -database "$(DB_DSN)" down 1
	@echo "Rollback complete!"

# Create a new migration file
migrate-create: install-migrate
	@if [ -z "$(NAME)" ]; then \
		echo "Error: NAME is required. Usage: make migrate-create NAME=add_user_table"; \
		exit 1; \
	fi
	@echo "Creating migration: $(NAME)"
	@migrate create -ext sql -dir $(MIGRATIONS_DIR) -seq $(NAME)
	@echo "Migration files created!"

# Force migration to specific version (use with caution!)
migrate-force: install-migrate
	@if [ -z "$(VERSION)" ]; then \
		echo "Error: VERSION is required. Usage: make migrate-force VERSION=1"; \
		exit 1; \
	fi
	@echo "Forcing migration version to $(VERSION)..."
	@migrate -path $(MIGRATIONS_DIR) -database "$(DB_DSN)" force $(VERSION)
	@echo "Version forced to $(VERSION)"

# Show current migration version
migrate-version: install-migrate
	@migrate -path $(MIGRATIONS_DIR) -database "$(DB_DSN)" version

# Run the application
run:
	@echo "Starting application..."
	@export DB_DSN="$(DB_DSN)" && go run cmd/server/main.go

# Build the application
build:
	@echo "Building application..."
	@CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/server ./cmd/server
	@echo "Build complete: bin/server"

# Run tests
test:
	@echo "Running tests..."
	@go test -v -race -coverprofile=coverage.out ./...
	@echo "Tests complete!"

# Docker commands
docker-build:
	@echo "Building Docker image..."
	@docker build -t refund-demo-backend .
	@echo "Docker image built!"

docker-run:
	@echo "Starting services with docker-compose..."
	@cd .. && docker-compose up --build

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf bin/
	@rm -f coverage.out
	@echo "Clean complete!"

# Seed demo data
seed:
	@echo "Seeding demo data..."
	@go run cmd/seed/main.go
	@echo "Demo data seeded successfully!"

# Clear all data and re-seed
seed-clear:
	@echo "Clearing all data and re-seeding..."
	@go run cmd/seed/main.go -clear
	@echo "Database cleared and re-seeded!"

# List all returns in database
seed-list:
	@echo "Listing all returns..."
	@psql "$(DB_DSN)" -c "SELECT return_id, status, eta_date, confidence, snap_context->>'description' as description FROM returns ORDER BY created_at DESC;"

# Seed data in Docker container
docker-seed:
	@echo "Seeding data in Docker container..."
	@docker-compose exec backend /root/seed
	@echo "Docker demo data seeded!"

# Development setup
setup: install-migrate
	@echo "Setting up development environment..."
	@go mod download
	@echo "Setup complete! Run 'make migrate-up' to apply migrations and 'make seed' for demo data."
