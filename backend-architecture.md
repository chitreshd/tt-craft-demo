Excellent ✅ — using **ULID** for IDs is a perfect choice here. It keeps IDs lexicographically sortable (by creation time) and unique across scraper / API / frontend flows — ideal for distributed, timestamped events like refund status updates.

Below is your **final refined `demo.md`** (Go + Next.js + PostgreSQL) updated to:

* Use **ULID** instead of UUID for all primary keys (`return_id`, `filing_id`).
* Include minimal ULID generation helpers.
* Adjust schema and code accordingly.

---

# TurboTax Refund Status Demo — PostgreSQL + ULID Implementation

> **Goal:** End-to-end demo that mimics TurboTax’s Refund ETA system with live refund status, Explain API (SSE), and optional IRS scraping — using ULIDs for sortable unique IDs.

---

## 🧱 **System Overview**

```
[ IRS Scraper (Go) ]
   ↓  (updates via ULID keys)
[ PostgreSQL ]
   ↕
[ Fiber API (Go + Zerolog) ]
   ├── GET /v1/status/:id
   ├── POST /v1/status/explain (SSE)
   └── POST /internal/scrape (manual trigger)
       ↓
[ Next.js Frontend (React + TS) ]
   ├── RefundStatusCard
   ├── RefundExplainBox
   └── Demo Page (/demo)
```

---

## ⚙️ **Backend — Go**

### 📂 Directory Layout

```
/backend
  /cmd/server/main.go
  /internal/api
      status.go
      explain.go
      scrape.go
  /internal/scraper/scraper.go
  /internal/store
      db.go
      model.go
      queries.go
  /internal/metrics/metrics.go
  go.mod
  Dockerfile
```

---

### 🧩 Go Dependencies

| Dependency                    | Purpose            |
| ----------------------------- | ------------------ |
| `github.com/gofiber/fiber/v2` | Web framework      |
| `github.com/rs/zerolog/log`   | Structured logging |
| `github.com/jmoiron/sqlx`     | SQL abstraction    |
| `github.com/lib/pq`           | PostgreSQL driver  |
| `github.com/robfig/cron/v3`   | Background jobs    |
| `github.com/oklog/ulid/v2`    | ULID generation    |

**`go.mod`**

```go
module refund-demo

go 1.22

require (
	github.com/gofiber/fiber/v2 v2.52.0
	github.com/rs/zerolog v1.31.0
	github.com/jmoiron/sqlx v1.4.0
	github.com/lib/pq v1.10.9
	github.com/robfig/cron/v3 v3.0.1
	github.com/oklog/ulid/v2 v2.1.0
)
```

---

### 🧠 **`main.go`**

```go
package main

import (
	"refund-demo/internal/api"
	"refund-demo/internal/scraper"
	"refund-demo/internal/store"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
)

func main() {
	db := store.InitPostgres()
	app := fiber.New()

	api.RegisterRoutes(app, db)
	go scraper.StartBackgroundJob(db)

	log.Info().Msg("Server running on :8080")
	app.Listen(":8080")
}
```

---

### 🔢 **ULID Helper (`/internal/store/id.go`)**

```go
package store

import (
	"crypto/rand"
	"time"

	"github.com/oklog/ulid/v2"
)

func NewULID() string {
	t := time.Now().UTC()
	entropy := ulid.Monotonic(rand.Reader, 0)
	return ulid.MustNew(ulid.Timestamp(t), entropy).String()
}
```

---

### 🧾 **Database Initialization (`db.go`)**

```go
package store

import (
	_ "github.com/lib/pq"
	"github.com/jmoiron/sqlx"
	"github.com/rs/zerolog/log"
)

func InitPostgres() *sqlx.DB {
	dsn := "postgres://demo:demo@postgres:5432/demo?sslmode=disable"
	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to postgres")
	}
	db.MustExec(schemaSQL)
	log.Info().Msg("connected to postgres")
	return db
}

const schemaSQL = `
CREATE TABLE IF NOT EXISTS returns (
  return_id TEXT PRIMARY KEY,
  filing_id TEXT,
  status TEXT,
  eta_date DATE,
  confidence REAL,
  history JSONB,
  snap_context JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
`
```

---

### 📋 **Model (`model.go`)**

```go
package store

import (
	"time"
	"encoding/json"
)

type RefundHistory struct {
	Stage     string    `json:"stage"`
	Timestamp time.Time `json:"timestamp"`
}

type RefundReturn struct {
	ReturnID    string          `db:"return_id" json:"return_id"`
	FilingID    string          `db:"filing_id" json:"filing_id"`
	Status      string          `db:"status" json:"status"`
	EtaDate     *time.Time      `db:"eta_date" json:"eta_date"`
	Confidence  float64         `db:"confidence" json:"confidence"`
	HistoryJSON json.RawMessage `db:"history" json:"history"`
	SnapContext json.RawMessage `db:"snap_context" json:"snap_context"`
	CreatedAt   time.Time       `db:"created_at" json:"created_at"`
}
```

---

### 📥 **Queries (`queries.go`)**

```go
package store

import (
	"encoding/json"
	"github.com/jmoiron/sqlx"
)

func GetReturnByID(db *sqlx.DB, id string) (*RefundReturn, error) {
	r := RefundReturn{}
	err := db.Get(&r, "SELECT * FROM returns WHERE return_id=$1", id)
	return &r, err
}

func InsertDemoReturn(db *sqlx.DB) error {
	history := []RefundHistory{
		{Stage: "FILED", Timestamp: Now()},
		{Stage: "ACCEPTED", Timestamp: Now().Add(24 * time.Hour)},
	}
	histJSON, _ := json.Marshal(history)
	return db.MustExec(`INSERT INTO returns 
	(return_id, filing_id, status, eta_date, confidence, history, snap_context) 
	VALUES ($1, $2, $3, CURRENT_DATE + interval '10 days', 0.94, $4, '{}'::jsonb)
	ON CONFLICT DO NOTHING`,
		NewULID(), NewULID(), "APPROVED", histJSON)
}
```

---

### 🔁 **Explain API (`explain.go`)**

```go
package api

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

func ExplainHandler(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/event-stream")
	chunks := []string{
		"It looks like your refund is taking a little longer than usual...",
		"High-income filers and early submissions are often reviewed more carefully...",
		"You can expect your deposit around March 20, with 94% confidence.",
	}
	for _, msg := range chunks {
		fmt.Fprintf(c, "data: %s\n\n", msg)
		c.Context().Flush()
		time.Sleep(500 * time.Millisecond)
	}
	fmt.Fprint(c, "data: [DONE]\n\n")
	return nil
}
```

---

### 🧠 **Status API (`status.go`)**

```go
package api

import (
	"refund-demo/internal/store"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
)

func RegisterRoutes(app *fiber.App, db *sqlx.DB) {
	api := app.Group("/v1")
	api.Get("/status/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		status, err := store.GetReturnByID(db, id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "not found"})
		}
		return c.JSON(status)
	})

	api.Post("/status/explain", ExplainHandler)
	app.Post("/internal/scrape", func(c *fiber.Ctx) error {
		store.InsertDemoReturn(db)
		return c.JSON(fiber.Map{"message": "demo data inserted"})
	})
}
```

---

## 💻 **Frontend — Next.js + TypeScript**

Same structure as before (React components + `/app/demo/page.tsx`)
No changes required — ULIDs are just treated as opaque strings.

---

## 🐳 **Docker Compose**

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: demo
      POSTGRES_PASSWORD: demo
      POSTGRES_DB: demo
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    environment:
      - DB_DSN=postgres://demo:demo@postgres:5432/demo?sslmode=disable

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

---

## 🚀 **Demo Flow**

1. Start services:

   ```bash
   docker-compose up --build
   ```
2. Insert mock demo record:

   ```bash
   curl -X POST http://localhost:8080/internal/scrape
   ```
3. Open **[http://localhost:3000/demo](http://localhost:3000/demo)**
4. See:

   * Refund timeline fetched by ULID
   * “Explain Delay” streaming response via SSE
5. Bonus: add new ULID records easily in DB or API for multi-user simulation.

---

Would you like me to include a **real Colly-based IRS scraper** (using ULIDs for new records + HTML parsing from `Where’s My Refund`) as the next section of this file?

