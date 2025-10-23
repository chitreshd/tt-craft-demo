# TurboTax Refund Status Demo

A full-stack production-ready application that mimics TurboTax's refund tracking system with live status updates, AI-powered explanations, and IRS data integration.


https://github.com/user-attachments/assets/12099af0-3549-413d-9f8b-f3db89e9431a




**Tech Stack:** Go (Fiber) + PostgreSQL + Next.js (TypeScript) + Docker

---

## 🎯 Overview

This demo showcases:
- ✅ **Real-time refund tracking** with status timelines
- ✅ **AI-powered explanations** via Server-Sent Events (SSE)
- ✅ **Production-ready architecture** with migrations, seeding, and Docker
- ✅ **ULID-based IDs** for distributed systems
- ✅ **Reusable component library** for frontend
- ✅ **8 realistic demo scenarios** with varying statuses

---

## 📁 Project Structure

```
tt-craft-demo/
├── backend/                      # Go backend (Fiber + PostgreSQL)
│   ├── cmd/
│   │   ├── server/              # Main application
│   │   └── seed/                # Demo data seeder
│   ├── internal/
│   │   ├── api/                 # HTTP handlers & routes
│   │   ├── store/               # Database layer (models, queries, migrations)
│   │   └── scraper/             # Background jobs (cron)
│   ├── migrations/              # Database migrations (golang-migrate)
│   ├── Dockerfile
│   ├── Makefile                 # Development commands
│   └── go.mod
│
├── frontend/                     # Next.js frontend (TypeScript + Tailwind)
│   ├── app/                     # Next.js app router
│   │   └── demo/               # Demo showcase page
│   ├── components/              # Reusable components
│   │   ├── RefundStatusCard/   # Status timeline widget
│   │   ├── RefundExplainBox/   # SSE streaming explanation
│   │   └── ui/                 # UI primitives (Card, Button, etc.)
│   ├── lib/                    # API client & utilities
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml           # Multi-service orchestration
├── start.sh                     # Quick start script
└── README.md                    # This file
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended - Fully Automatic)

```bash
# Clone and start everything
git clone <repository-url>
cd tt-craft-demo
docker-compose up --build
```

**What happens automatically:**
1. PostgreSQL starts and initializes
2. Backend runs migrations (creates schema)
3. Demo data seeds automatically (`DEMO_MODE=true`)
4. Frontend starts and connects to backend
5. All services are ready!

**Access:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

### Option 2: Local Development

**Prerequisites:**
- Go 1.22+
- Node.js 20+
- PostgreSQL 16+

**Backend:**
```bash
# Start PostgreSQL
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=demo \
  -e POSTGRES_PASSWORD=demo \
  -e POSTGRES_DB=demo \
  postgres:16

# Setup backend
cd backend
export DB_DSN="postgres://demo:demo@localhost:5432/demo?sslmode=disable"
make migrate-up        # Run migrations
make seed             # Seed demo data
make run              # Start server (port 8080)
```

**Frontend:**
```bash
# In a new terminal
cd frontend
npm install
npm run dev           # Start frontend (port 3000)
```

**Quick Script:**
```bash
./start.sh            # Starts both backend and frontend
```

---

## 🏗️ Backend Architecture

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Go** | 1.22+ | Programming language |
| **Fiber** | v2.52 | Fast web framework (Express-like) |
| **PostgreSQL** | 16 | Primary database |
| **sqlx** | v1.4 | SQL toolkit and query builder |
| **Zerolog** | v1.31 | Structured JSON logging |
| **golang-migrate** | v4.19 | Database migrations |
| **ULID** | v2.1 | Sortable unique identifiers |
| **cron** | v3.0 | Background job scheduling |

### Architecture Highlights

#### **Clean Architecture Pattern**
```
cmd/          → Entry points (server, seed)
internal/     → Private application code
  ├── api/    → HTTP handlers and routing
  ├── store/  → Data access layer (models, queries)
  └── scraper/→ Background jobs
```

#### **Key Design Decisions**

**1. ULID-Based IDs**
- Lexicographically sortable by creation time
- Compatible with distributed systems
- Human-readable 26-character strings
- Example: `01HZDEM0001AAAAAAAAAAAAAAA`

**2. Database Migrations (golang-migrate)**
- Version-controlled SQL files in `migrations/`
- Automatic execution on app startup
- Up/down migrations for rollback support
- Schema-only (no data in migrations)
- **See:** `backend/MIGRATIONS.md`

**3. Go-Based Seed Data**
- Demo data via Go code, not migrations
- Controlled by `DEMO_MODE` environment variable
- 8 realistic tax refund scenarios
- Idempotent (safe to re-run)
- **See:** `backend/DEMO_DATA.md`

**4. Server-Sent Events (SSE)**
- Real-time streaming for AI explanations
- Low-latency, efficient
- Built-in browser support
- Endpoint: `POST /v1/status/explain`

**5. Structured Logging**
- JSON-formatted logs with Zerolog
- Contextual fields (return_id, status, etc.)
- Production-ready observability

**6. Background Jobs**
- Cron-based scheduler for IRS scraping
- Runs daily at midnight UTC
- Automatic ULID generation for new records

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/v1/status/:id` | Get refund status by ULID |
| POST | `/v1/status/explain` | Stream AI explanation (SSE) |
| POST | `/internal/scrape` | Manually insert demo data |

### API Documentation

- **OpenAPI Spec**: [`backend/openapi.yaml`](backend/openapi.yaml) - Complete API specification (OpenAPI 3.0)
- **Postman Collection**: [`backend/postman_collection.json`](backend/postman_collection.json) - Import into Postman

**Quick Start with Postman:**
1. Open Postman → Import
2. Select `backend/postman_collection.json`
3. Set `baseUrl` to `http://localhost:8080`
4. Try the requests!

### Database Schema

```sql
CREATE TABLE returns (
  return_id TEXT PRIMARY KEY,              -- ULID
  filing_id TEXT NOT NULL,                 -- ULID
  status TEXT NOT NULL,                    -- Current status
  eta_date DATE,                           -- Estimated refund date
  confidence REAL CHECK (0 <= confidence <= 1),
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  snap_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_returns_filing_id ON returns(filing_id);
CREATE INDEX idx_returns_status ON returns(status);
CREATE INDEX idx_returns_created_at ON returns(created_at DESC);

-- Auto-update trigger
CREATE TRIGGER update_returns_updated_at 
  BEFORE UPDATE ON returns
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

**Refund Status Flow:**
```
FILED → ACCEPTED → APPROVED → SENT → COMPLETED
              ↓
           REVIEW (if issues)
```

### Major Backend Commands

```bash
cd backend

# Database Migrations
make migrate-up          # Apply all pending migrations
make migrate-down        # Rollback last migration
make migrate-create NAME=xyz  # Create new migration
make migrate-version     # Show current version

# Demo Data Seeding
make seed               # Seed 8 demo returns
make seed-clear         # Clear all data and re-seed
make seed-list          # Show all seeded returns

# Development
make run                # Start server
make build              # Build binary
make test               # Run tests
make help               # Show all commands

# Docker
docker-compose up --build  # Start all services
```

### Backend Dependencies

**Core:**
```go
github.com/gofiber/fiber/v2 v2.52.0    // Web framework
github.com/jmoiron/sqlx v1.4.0         // SQL toolkit
github.com/lib/pq v1.10.9              // PostgreSQL driver
github.com/rs/zerolog v1.31.0          // Structured logging
```

**Migrations & IDs:**
```go
github.com/golang-migrate/migrate/v4 v4.19.0  // Database migrations
github.com/oklog/ulid/v2 v2.1.0              // ULID generation
```

**Background Jobs:**
```go
github.com/robfig/cron/v3 v3.0.1      // Cron scheduler
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `DB_DSN` | `postgres://demo:demo@localhost:5432/demo?sslmode=disable` | Database connection string |
| `DEMO_MODE` | `false` | Auto-seed demo data on startup |
| `MIGRATIONS_PATH` | `file://migrations` | Path to migration files |

### Docker Setup (Backend)

**Dockerfile:**
- Multi-stage build (builder + alpine)
- Compiles both `main` and `seed` binaries
- Copies migrations directory
- Final image ~15MB

**docker-compose.yml:**
```yaml
backend:
  build: ./backend
  ports:
    - "8080:8080"
  environment:
    - DB_DSN=postgres://demo:demo@postgres:5432/demo?sslmode=disable
    - DEMO_MODE=true  # Auto-seed on startup
    - MIGRATIONS_PATH=file://migrations
  depends_on:
    postgres:
      condition: service_healthy
```

### Key Backend Files

| File | Purpose |
|------|---------|
| `cmd/server/main.go` | Application entry point |
| `cmd/seed/main.go` | Standalone seeder |
| `internal/api/status.go` | Route registration + status endpoint |
| `internal/api/explain.go` | SSE streaming endpoint |
| `internal/store/db.go` | Database connection + migration runner |
| `internal/store/seed.go` | Demo data generation (204 lines) |
| `internal/store/model.go` | Data models & types |
| `internal/store/queries.go` | Database queries |
| `internal/scraper/scraper.go` | Background cron jobs |
| `migrations/000001_*.sql` | Schema migration |
| `Makefile` | Development commands (102 lines) |

### Backend Documentation

- **`backend/README.md`** - Backend overview
- **`backend/MIGRATIONS.md`** - Migration guide (390 lines)
- **`backend/DEMO_DATA.md`** - Seeding guide (482 lines)
- **`backend/ARCHITECTURE_DECISIONS.md`** - ADRs

---

## 🎨 Frontend Architecture

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5 | React framework (App Router) |
| **React** | 19.1 | UI library |
| **TypeScript** | 5+ | Type-safe JavaScript |
| **Tailwind CSS** | 4.0 | Utility-first CSS |
| **Turbopack** | Built-in | Fast bundler (Rust-based) |

### Architecture Highlights

#### **Component-Driven Design**
```
components/
├── RefundStatusCard/       # Reusable status timeline
│   ├── index.tsx
│   ├── RefundStatusCard.tsx
│   └── types.ts
├── RefundExplainBox/       # SSE streaming explanation
│   ├── index.tsx
│   ├── RefundExplainBox.tsx
│   └── useExplainStream.ts  # Custom hook for SSE
└── ui/                     # Primitive components
    ├── Card.tsx
    ├── Button.tsx
    └── ProgressBar.tsx
```

#### **Key Design Decisions**

**1. Reusable Components**
- Self-contained feature modules
- Drop-in widgets for any page
- Consistent styling via UI primitives

**2. Custom Hooks for SSE**
- `useExplainStream` abstracts SSE complexity
- Declarative API for streaming data
- Easy to test and maintain

**3. Type Safety**
- Centralized TypeScript types
- Matches backend models exactly
- Safe refactoring with autocompletion

**4. App Router (Next.js 15)**
- File-based routing in `app/`
- Server components by default
- Client components only when needed

**5. Tailwind CSS v4**
- Utility-first styling
- PostCSS integration
- Consistent design system

### Frontend Components

#### **RefundStatusCard**
Displays refund status timeline with:
- Current status badge
- Progress bar
- History timeline
- ETA and confidence score
- **Props:** `{ data: RefundStatus }`

#### **RefundExplainBox**
AI-powered explanation via SSE:
- "Explain Delay" button
- Streaming text response
- Real-time updates
- **Props:** `{ returnId: string }`

#### **UI Primitives**
- `Card` - Styled container
- `Button` - Interactive button
- `ProgressBar` - Visual progress indicator
- `Typography` - Text components

### API Integration

**SSE Streaming Example:**
```typescript
// useExplainStream hook
export const useExplainStream = (setText: (txt: string) => void) => {
  const startStream = async (returnId: string) => {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ return_id: returnId }),
    })
    
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader!.read()
      if (done) break
      setText(prev => prev + decoder.decode(value))
    }
  }
  return { startStream }
}
```

### Major Frontend Commands

```bash
cd frontend

# Development
npm install             # Install dependencies
npm run dev            # Start dev server (Turbopack)
npm run build          # Production build
npm start              # Start production server

# Linting (if configured)
npm run lint           # Run ESLint
```

### Frontend Dependencies

**Core:**
```json
{
  "next": "15.5.6",
  "react": "19.1.0",
  "react-dom": "19.1.0"
}
```

**Dev Dependencies:**
```json
{
  "typescript": "^5",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "tailwindcss": "^4",
  "@tailwindcss/postcss": "^4"
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend API URL |

**Create `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Docker Setup (Frontend)

**Dockerfile:**
- Multi-stage build (dependencies + builder + runner)
- Optimized layer caching
- Production-ready Next.js build
- Runs on port 3000

**docker-compose.yml:**
```yaml
frontend:
  build: ./frontend
  ports:
    - "3000:3000"
  environment:
    - NEXT_PUBLIC_API_URL=http://localhost:8080
  depends_on:
    - backend
```

### Key Frontend Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Home page |
| `app/demo/page.tsx` | Demo showcase combining components |
| `app/layout.tsx` | Root layout with global styles |
| `components/RefundStatusCard/` | Status timeline component |
| `components/RefundExplainBox/` | SSE streaming component |
| `components/ui/` | Reusable UI primitives |
| `lib/api.ts` | API client utilities |
| `tailwind.config.ts` | Tailwind configuration |
| `tsconfig.json` | TypeScript configuration |

### Frontend Documentation

- **`frontend/README.md`** - Frontend overview
- **`frontend-architecture.md`** - Detailed architecture

---

## 🐳 Docker Architecture

### Multi-Service Setup

```yaml
version: '3.9'

services:
  postgres:          # Database
    image: postgres:16
    ports: ["5432:5432"]
    healthcheck: pg_isready
    
  backend:           # Go API
    build: ./backend
    ports: ["8080:8080"]
    depends_on: postgres (healthy)
    
  frontend:          # Next.js UI
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: backend
```

### Service Dependencies

```
PostgreSQL (healthy) → Backend (migrations + seed) → Frontend
```

### Volume Persistence

```yaml
volumes:
  postgres-data:     # Persists database between restarts
```

### Docker Commands

```bash
# Start everything
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop everything
docker-compose down

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Restart service
docker-compose restart backend

# Execute command in container
docker-compose exec backend ./seed
docker-compose exec postgres psql -U demo -d demo
```

---

## 🧪 Testing the System

### 1. Health Check

```bash
curl http://localhost:8080/health
# {"status":"healthy","service":"refund-demo"}
```

### 2. List Demo Returns

```bash
cd backend
make seed-list
# Shows 8 seeded returns with IDs
```

### 3. Get Refund Status

```bash
curl http://localhost:8080/v1/status/01HZDEM0001AAAAAAAAAAAAAAA
```

**Response:**
```json
{
  "return_id": "01HZDEM0001AAAAAAAAAAAAAAA",
  "filing_id": "01HZFIL0001AAAAAAAAAAAAAAA",
  "status": "FILED",
  "eta_date": "2025-11-07T00:00:00Z",
  "confidence": 0.85,
  "history": [
    {
      "stage": "FILED",
      "timestamp": "2025-10-15T12:00:00Z"
    }
  ],
  "snap_context": {
    "demo": true,
    "description": "Recently filed return",
    "scenario": 1,
    "amount": 5000
  }
}
```

### 4. Stream Explanation (SSE)

```bash
curl -N http://localhost:8080/v1/status/explain
```

**Response (streamed):**
```
data: It looks like your refund is taking a little longer than usual...

data: High-income filers and early submissions are often reviewed more carefully...

data: You can expect your deposit around March 20, with 94% confidence.

data: [DONE]
```

### 5. Test Frontend

Open browser: http://localhost:3000/demo
- See status timeline
- Click "Explain Delay"
- Watch streaming explanation

---

## 📊 Demo Data Scenarios

After seeding (`make seed` or `DEMO_MODE=true`), you'll have **8 realistic returns**:

| # | Status | ETA | Confidence | Description |
|---|--------|-----|------------|-------------|
| 1 | FILED | +21d | 85% | Recently filed return |
| 2 | ACCEPTED | +14d | 88% | Accepted and under review |
| 3 | APPROVED | +7d | 94% | Approved, payment processing |
| 4 | SENT | +2d | 98% | Refund sent, arriving soon |
| 5 | COMPLETED | -3d | 100% | Refund completed |
| 6 | REVIEW | +28d | 72% | Under additional review |
| 7 | ACCEPTED | +18d | 91% | Early filer, high income |
| 8 | APPROVED | +10d | 92% | Standard return on track |

Each return includes:
- Complete history timeline
- Realistic timestamps
- Metadata (amounts $5K-$7.5K, descriptions)
- Demo flag for easy cleanup

---

## 🔧 Development Workflow

### Adding a New Backend Endpoint

1. **Define handler** in `internal/api/`
2. **Register route** in `api.RegisterRoutes()`
3. **Add database query** in `internal/store/queries.go` (if needed)
4. **Test locally**: `make run`
5. **Document** in this README

### Creating a Database Migration

```bash
cd backend
make migrate-create NAME=add_user_table

# Edit the generated files:
# - migrations/000002_add_user_table.up.sql
# - migrations/000002_add_user_table.down.sql

# Test
make migrate-up
make migrate-down  # Test rollback
make migrate-up    # Re-apply

# Commit
git add migrations/
git commit -m "Add user table migration"
```

### Adding Demo Data Scenarios

1. **Edit** `backend/internal/store/seed.go`
2. **Add new `DemoReturn`** to `demoReturns` slice
3. **Test**: `make seed-clear && make seed`
4. **Verify**: `make seed-list`

### Adding a Frontend Component

1. **Create** `components/MyComponent/`
2. **Export** via `index.tsx`
3. **Add types** in `types.ts`
4. **Use** in `app/demo/page.tsx`
5. **Style** with Tailwind classes

---

## 📚 Documentation

### Main Docs
- **This README** - Project overview
- **`start.sh`** - Quick start script
- **`docker-compose.yml`** - Service configuration

### Backend Docs
- **`backend/README.md`** - Backend overview
- **`backend/MIGRATIONS.md`** - Database migrations guide (390 lines)
- **`backend/DEMO_DATA.md`** - Demo data seeding guide (482 lines)
- **`backend/ARCHITECTURE_DECISIONS.md`** - Architectural Decision Records
- **`MIGRATION_QUICK_START.md`** - Migration quick reference
- **`SEED_QUICK_REFERENCE.md`** - Seeding cheat sheet

### Frontend Docs
- **`frontend/README.md`** - Frontend overview
- **`frontend-architecture.md`** - Detailed architecture

### Implementation Docs
- **`BACKEND_IMPLEMENTATION_SUMMARY.md`** - Backend build summary
- **`DATABASE_MIGRATIONS_IMPLEMENTATION.md`** - Migration implementation
- **`DEMO_DATA_IMPLEMENTATION_SUMMARY.md`** - Seeding implementation
- **`SEEDING_ARCHITECTURE_CLARIFICATION.md`** - Architecture cleanup

---

## 🎯 Key Features

### ✅ Backend
- RESTful API with Fiber (Go's fastest web framework)
- PostgreSQL with JSONB for flexible data
- ULID-based IDs (sortable, distributed-system friendly)
- golang-migrate for schema versioning
- Go-based demo data seeding (8 scenarios)
- Server-Sent Events (SSE) for streaming
- Structured logging with Zerolog
- Background cron jobs
- Docker-ready with health checks
- Production-grade error handling

### ✅ Frontend
- Next.js 15 with App Router
- React 19 with Server Components
- TypeScript for type safety
- Tailwind CSS v4 for styling
- Reusable component architecture
- SSE streaming integration
- Custom hooks for data fetching
- Turbopack for fast builds
- Responsive design
- Docker-ready

### ✅ DevOps
- Multi-stage Docker builds
- docker-compose orchestration
- Automatic migrations on startup
- Optional demo data seeding
- Health checks for dependencies
- Volume persistence
- Environment-based configuration
- Quick start script

---

## 🔐 Production Considerations

### What's Production-Ready
✅ Structured logging  
✅ Database migrations  
✅ Health check endpoints  
✅ CORS configuration  
✅ Error handling  
✅ Type safety (Go + TypeScript)  
✅ Docker containerization  
✅ Environment variables  

### What Would Need Work for Production
⚠️ Authentication & authorization  
⚠️ Rate limiting  
⚠️ API documentation (Swagger/OpenAPI)  
⚠️ Comprehensive tests  
⚠️ Monitoring & alerting (Prometheus, Datadog)  
⚠️ Secrets management (Vault, AWS Secrets Manager)  
⚠️ SSL/TLS certificates  
⚠️ CI/CD pipeline  
⚠️ Load balancing  
⚠️ Database replication  

---

## 🐛 Troubleshooting

### Backend won't start

**Check logs:**
```bash
docker-compose logs backend
```

**Common issues:**
- PostgreSQL not ready → Health check ensures this doesn't happen
- Port 8080 already in use → Change `PORT` in docker-compose.yml
- Migration failed → Check `migrations/` SQL syntax

### Frontend won't connect to backend

**Check API URL:**
```bash
# In frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Test backend directly:**
```bash
curl http://localhost:8080/health
```

### Demo data not seeding

**Check DEMO_MODE:**
```bash
docker-compose exec backend env | grep DEMO_MODE
# Should show: DEMO_MODE=true
```

**Manual seed:**
```bash
cd backend
make seed
```

### Database connection issues

**Test connection:**
```bash
psql "postgres://demo:demo@localhost:5432/demo?sslmode=disable"
```

**Reset database:**
```bash
docker-compose down -v  # Removes volumes
docker-compose up --build
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes
4. Test locally (`docker-compose up --build`)
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open Pull Request

---

## 📝 License

MIT License - feel free to use this project for learning, demos, or as a starter template.

---

## 🙏 Acknowledgments

- **Fiber** - Fast Go web framework
- **golang-migrate** - Database migration tool
- **Next.js** - React framework
- **PostgreSQL** - Reliable database
- **Tailwind CSS** - Utility-first CSS

---

## 📞 Support

- **Issues**: Open a GitHub issue
- **Docs**: Check `backend/` and `frontend/` README files
- **Architecture**: See `ARCHITECTURE_DECISIONS.md`

---

**Built with ❤️ for demonstrating production-ready full-stack architecture**

**Quick Start:** `docker-compose up --build` 🚀
