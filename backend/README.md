# TurboTax Refund Status Demo - Backend

A Go-based backend service for tracking and explaining tax refund status, built with Fiber, PostgreSQL, and Server-Sent Events.

## 🏗️ Architecture

```
/backend
  /cmd/server          # Main application entry point
  /internal
    /api              # HTTP handlers and routes
    /scraper          # Background scraping jobs
    /store            # Database models and queries
  /pkg                # Public packages (if needed)
```

## 🔧 Tech Stack

- **Framework**: Fiber v2 (fast HTTP web framework)
- **Database**: PostgreSQL 16 with JSONB support
- **Logging**: Zerolog (structured logging)
- **Database Layer**: sqlx + lib/pq
- **Background Jobs**: robfig/cron
- **ID Generation**: ULID (lexicographically sortable)

## 📡 API Endpoints

### Status Endpoints

- **GET `/v1/status/:id`** - Get refund status by return ID
  ```bash
  curl http://localhost:8080/v1/status/01HZ3E7XQMQR8Z9YPQT5WKX4VA
  ```

- **POST `/v1/status/explain`** - Stream AI-like explanation via SSE
  ```bash
  curl -N http://localhost:8080/v1/status/explain
  ```

### Internal Endpoints

- **POST `/internal/scrape`** - Manually trigger demo data insertion
  ```bash
  curl -X POST http://localhost:8080/internal/scrape
  ```

- **GET `/health`** - Health check endpoint
  ```bash
  curl http://localhost:8080/health
  ```

### API Documentation

**OpenAPI Specification**: `openapi.yaml`
- Complete API spec in OpenAPI 3.0 format
- Includes all endpoints, schemas, and examples
- View in Swagger Editor: https://editor.swagger.io

**Postman Collection**: `postman_collection.json`
- Ready-to-import Postman collection
- Pre-configured requests with examples
- Collection variables for easy configuration

**To use in Postman:**
1. Open Postman → Import → Upload Files
2. Select `backend/postman_collection.json`
3. Set `baseUrl` variable to `http://localhost:8080`
4. Try the example requests!

## 🗄️ Database Schema

```sql
CREATE TABLE returns (
  return_id TEXT PRIMARY KEY,           -- ULID
  filing_id TEXT,                       -- ULID
  status TEXT,                          -- e.g., "FILED", "APPROVED", "SENT"
  eta_date DATE,                        -- Estimated refund date
  confidence REAL,                      -- Confidence score (0.0-1.0)
  history JSONB,                        -- Array of status changes
  snap_context JSONB,                   -- Snapshot context data
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 🚀 Getting Started

### Prerequisites

- Go 1.22+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (Recommended)

```bash
# Start all services (PostgreSQL + Backend + Frontend)
docker-compose up --build

# Backend will be available at http://localhost:8080
```

### Option 2: Local Development

```bash
# 1. Start PostgreSQL
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=demo \
  -e POSTGRES_PASSWORD=demo \
  -e POSTGRES_DB=demo \
  postgres:16

# 2. Set database connection
export DB_DSN="postgres://demo:demo@localhost:5432/demo?sslmode=disable"

# 3. Run the backend
cd backend
go run cmd/server/main.go
```

## 🔍 Key Features

### 1. ULID-Based IDs
- Lexicographically sortable by creation time
- Compatible with distributed systems
- Human-readable format

### 2. Server-Sent Events (SSE)
- Real-time streaming responses
- Mimics AI-powered explanations
- Low latency, efficient

### 3. Structured Logging
- JSON-formatted logs with Zerolog
- Log levels and structured fields
- Production-ready observability

### 4. Background Jobs
- Cron-based scheduling
- Daily IRS data scraping (simulated)
- Automatic ULID generation for new records

### 5. CORS Support
- Configured for frontend at localhost:3000
- Credentials support enabled
- Production-ready CORS middleware

## 📦 Dependencies

```go
require (
	github.com/gofiber/fiber/v2 v2.52.0   // Web framework
	github.com/rs/zerolog v1.31.0          // Structured logging
	github.com/jmoiron/sqlx v1.4.0         // SQL extensions
	github.com/lib/pq v1.10.9              // PostgreSQL driver
	github.com/robfig/cron/v3 v3.0.1       // Cron scheduling
	github.com/oklog/ulid/v2 v2.1.0        // ULID generation
)
```

## 🌱 Demo Data Seeding

### Automatic Seeding (Docker with DEMO_MODE)

When running with Docker Compose, demo data seeds automatically:
```bash
docker-compose up --build
# Demo data is automatically seeded on startup!
```

This creates **8 demo returns** with various statuses:
- Recently filed return
- Accepted and under review
- Approved and payment processing
- Sent - refund on the way
- Completed - refund received
- Under additional review
- Early filer with high income
- Standard return on track

### Manual Seeding (Local Development)

```bash
# Seed demo data
make seed

# Clear all data and re-seed
make seed-clear

# List all seeded returns
make seed-list
```

### Seeding via API

```bash
# Insert a single demo return
curl -X POST http://localhost:8080/internal/scrape
# Returns: {"message":"demo data inserted","return_id":"01HZ3E..."}
```

## 🧪 Testing the API

```bash
# 1. Seed demo data first (if not using DEMO_MODE)
make seed

# 2. List all returns to get IDs
make seed-list

# 3. Get refund status (use any return_id from the list)
curl http://localhost:8080/v1/status/01HZDEM0001AAAAAAAAAAAAAAA

# 4. Stream explanation
curl -N http://localhost:8080/v1/status/explain

# 5. Check health
curl http://localhost:8080/health
```

## 🌐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `DB_DSN` | `postgres://demo:demo@localhost:5432/demo?sslmode=disable` | PostgreSQL connection string |

## 🏗️ Project Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── api/
│   │   ├── status.go           # Status endpoints + route registration
│   │   └── explain.go          # SSE streaming endpoint
│   ├── scraper/
│   │   └── scraper.go          # Background cron jobs
│   └── store/
│       ├── db.go               # Database initialization
│       ├── model.go            # Data models
│       ├── queries.go          # Database queries
│       └── id.go               # ULID generation helper
├── go.mod
├── go.sum
├── Dockerfile
└── README.md
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection manually
psql -h localhost -U demo -d demo -W
```

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

## 🗂️ Database Migrations

### Why golang-migrate?

We use **golang-migrate** for production-ready database migrations:

✅ **Version Control** - All schema changes tracked in Git  
✅ **Rollback Support** - Easy to revert problematic changes  
✅ **Team Collaboration** - Clear history of database evolution  
✅ **Environment Parity** - Same migrations across dev/staging/prod  
✅ **Audit Trail** - Know exactly when and what changed  

### Migration Workflow

```bash
# 1. Create a new migration
make migrate-create NAME=add_column_to_returns

# 2. Edit the generated files
# - migrations/000002_add_column_to_returns.up.sql
# - migrations/000002_add_column_to_returns.down.sql

# 3. Apply the migration
make migrate-up

# 4. Commit the migration files to Git
git add migrations/
git commit -m "Add migration: add column to returns"
```

### Migration Best Practices

1. **Always write down migrations** - Every up needs a down
2. **Test locally first** - Never run untested migrations in production
3. **One logical change per migration** - Keep migrations focused
4. **Never modify existing migrations** - Create new ones to fix issues
5. **Use transactions** - Wrap DDL in `BEGIN`/`COMMIT` where possible

### Schema Migrations Table

golang-migrate creates a `schema_migrations` table to track applied migrations:

```sql
SELECT * FROM schema_migrations;
-- version | dirty
-- --------|------
-- 1       | false
```

## 📝 Next Steps

- [ ] Add more migrations (e.g., users table, audit logs)
- [ ] Add real IRS scraping with Colly
- [ ] Implement user authentication
- [ ] Add metrics and monitoring
- [ ] Add unit and integration tests
- [ ] Implement rate limiting
- [ ] Add OpenAPI/Swagger documentation

## 🤝 Contributing

This is a demo project. Feel free to fork and customize for your needs.

## 📄 License

MIT
