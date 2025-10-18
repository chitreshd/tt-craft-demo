# Demo Data Seeding Guide

## 🌱 Overview

The backend includes a comprehensive demo data seeding system that populates the database with realistic tax refund scenarios for testing and demonstration purposes.

## 📦 What Gets Seeded

When you seed the database, **8 demo returns** are created with different statuses and timelines:

| # | Status | ETA | Confidence | Description |
|---|--------|-----|------------|-------------|
| 1 | `FILED` | +21 days | 85% | Recently filed return |
| 2 | `ACCEPTED` | +14 days | 88% | Accepted and under review |
| 3 | `APPROVED` | +7 days | 94% | Approved and payment processing |
| 4 | `SENT` | +2 days | 98% | Refund sent - arriving soon |
| 5 | `COMPLETED` | -3 days | 100% | Refund completed |
| 6 | `REVIEW` | +28 days | 72% | Under additional review |
| 7 | `ACCEPTED` | +18 days | 91% | Early filer with high income |
| 8 | `APPROVED` | +10 days | 92% | Standard return on track |

Each return includes:
- **Unique ULID identifiers** for `return_id` and `filing_id`
- **Realistic timestamps** based on current date
- **Status history** showing progression through stages
- **Confidence scores** indicating ETA reliability
- **Metadata** including demo flag, description, and refund amount

---

## 🚀 Quick Start

### Option 1: Automatic (Docker with DEMO_MODE)

**Easiest way** - Just start Docker Compose:

```bash
docker-compose up --build
```

With `DEMO_MODE=true` in `docker-compose.yml`, demo data seeds automatically when the backend starts.

**Check logs:**
```bash
docker-compose logs backend | grep -i seed
# Output: "demo mode enabled - seeding data"
#         "demo data seeded successfully"
```

### Option 2: Manual Seeding (Local Development)

```bash
# Navigate to backend
cd backend

# Seed demo data
make seed

# Output:
# Seeding demo data...
# inserted demo return (scenario 1, FILED)
# inserted demo return (scenario 2, ACCEPTED)
# ...
# demo data seeded successfully (8 returns)
```

### Option 3: Using Standalone Seed Command

```bash
# Run seed command directly
go run cmd/seed/main.go

# With custom database connection
go run cmd/seed/main.go -dsn "postgres://user:pass@host:5432/db?sslmode=disable"

# Clear existing data first
go run cmd/seed/main.go -clear
```

### Note on Migrations

Seed data is **NOT** part of migrations. Migrations are for schema changes only. Use the methods above (DEMO_MODE, make seed, or standalone command) for seeding data.

---

## 🛠️ Makefile Commands

| Command | Description |
|---------|-------------|
| `make seed` | Seed demo data (skips if data exists) |
| `make seed-clear` | Clear all data and re-seed |
| `make seed-list` | Show all seeded returns in table format |
| `make docker-seed` | Seed data in running Docker container |

---

## 📋 Detailed Examples

### Seed Fresh Data

```bash
cd backend
make seed
```

**Output:**
```
Seeding demo data...
{"level":"info","message":"connected to database"}
{"level":"info","scenario":1,"return_id":"01HZ...","status":"FILED","description":"Recently filed return","message":"inserted demo return"}
{"level":"info","scenario":2,"return_id":"01HZ...","status":"ACCEPTED","description":"Accepted and under review","message":"inserted demo return"}
...
{"level":"info","count":8,"message":"demo data seeded successfully"}
✅ demo data seeding complete!
```

### Clear and Re-seed

```bash
make seed-clear
```

**Output:**
```
Clearing all data and re-seeding...
{"level":"warn","message":"clearing all existing returns..."}
{"level":"info","message":"existing data cleared"}
{"level":"info","message":"seeding demo data..."}
...
{"level":"info","total_returns":8,"message":"seeding completed successfully"}
```

### List All Seeded Returns

```bash
make seed-list
```

**Output:**
```
      return_id       |  status   |  eta_date  | confidence |           description
----------------------+-----------+------------+------------+----------------------------------
 01HZDEM0001AAAA...   | FILED     | 2025-11-07 |       0.85 | Recently filed return
 01HZDEM0002BBBB...   | ACCEPTED  | 2025-10-31 |       0.88 | Accepted and under review
 01HZDEM0003CCCC...   | APPROVED  | 2025-10-24 |       0.94 | Approved and payment processing
 ...
```

---

## 🔍 Inspecting Seeded Data

### Via psql

```bash
# Connect to database
psql "postgres://demo:demo@localhost:5432/demo?sslmode=disable"

# View all returns
SELECT 
  return_id, 
  status, 
  eta_date, 
  confidence,
  snap_context->>'description' as description,
  snap_context->>'amount' as refund_amount
FROM returns 
ORDER BY created_at DESC;

# Check demo flag
SELECT COUNT(*) FROM returns WHERE snap_context->>'demo' = 'true';
```

### Via API

```bash
# Get all return IDs from logs or database, then:
curl http://localhost:8080/v1/status/01HZDEM0001AAAAAAAAAAAAAAA

# Response:
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

---

## 🎯 Seed Data Details

### Return Status Progression

```
FILED → ACCEPTED → APPROVED → SENT → COMPLETED
                 ↓
              REVIEW (if issues detected)
```

### History Timeline Examples

**Scenario 1: FILED (Recent)**
```json
[
  {"stage": "FILED", "timestamp": "2 days ago"}
]
```

**Scenario 4: SENT (Almost complete)**
```json
[
  {"stage": "FILED", "timestamp": "21 days ago"},
  {"stage": "ACCEPTED", "timestamp": "19 days ago"},
  {"stage": "APPROVED", "timestamp": "5 days ago"},
  {"stage": "SENT", "timestamp": "1 day ago"}
]
```

### Snapshot Context

Each return includes metadata:
```json
{
  "demo": true,
  "description": "Approved and payment processing",
  "scenario": 3,
  "amount": 6000
}
```

---

## 🔧 Customizing Seed Data

### Modify Seed Logic

Edit `backend/internal/store/seed.go`:

```go
// Add your custom demo return
demoReturns = append(demoReturns, DemoReturn{
    Status:      "PENDING",
    EtaDate:     datePtr(time.Now().AddDate(0, 0, 30)),
    Confidence:  0.80,
    History:     []RefundHistory{{Stage: "PENDING", Timestamp: time.Now()}},
    Description: "Custom scenario",
})
```

Then run:
```bash
make seed-clear  # Clear old data
make seed        # Apply new data
```

### Add More Returns

The seeding function is idempotent and checks for existing data:

```go
func SeedDemoData(db *sqlx.DB) error {
    var count int
    db.Get(&count, "SELECT COUNT(*) FROM returns")
    
    if count > 0 {
        log.Info().Msg("demo data already exists, skipping seed")
        return nil
    }
    // ... seed logic
}
```

---

## 🐳 Docker Integration

### Enable DEMO_MODE

In `docker-compose.yml`:
```yaml
backend:
  environment:
    - DEMO_MODE=true  # Auto-seed on startup
```

### Disable Auto-Seeding

Remove or set to false:
```yaml
backend:
  environment:
    - DEMO_MODE=false  # No auto-seed
```

### Manual Seeding in Docker

```bash
# If seed binary is available in container
docker-compose exec backend ./seed

# Or run via main app with DEMO_MODE
docker-compose exec backend sh -c "DEMO_MODE=true ./main"
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEMO_MODE` | `false` | Auto-seed on app startup if `true` |
| `DB_DSN` | `postgres://demo:demo@localhost:5432/demo?sslmode=disable` | Database connection |

---

## 🧪 Testing with Seed Data

### Test Different Scenarios

```bash
# 1. Seed data
make seed

# 2. Get a FILED return (recently submitted)
curl http://localhost:8080/v1/status/01HZDEM0001AAAAAAAAAAAAAAA

# 3. Get a SENT return (almost delivered)
curl http://localhost:8080/v1/status/01HZDEM0004DDDDDDDDDDDDDD

# 4. Get a COMPLETED return
curl http://localhost:8080/v1/status/01HZDEM0005EEEEEEEEEEEEEE

# 5. Test explanation endpoint
curl -N http://localhost:8080/v1/status/explain
```

### Test Frontend Integration

With demo data seeded, the frontend can:
- Display multiple refund statuses
- Show progression timelines
- Test different confidence levels
- Demonstrate ETA calculations

---

## 🔄 Idempotency

The seed system is **idempotent** - safe to run multiple times:

```bash
make seed  # First run: Seeds data
make seed  # Second run: Skips (data exists)
make seed  # Third run: Skips (data exists)
```

To force re-seed:
```bash
make seed-clear  # Clears and re-seeds
```

---

## 📊 Seed Data Summary

After seeding, check statistics:

```bash
# Via seed command
go run cmd/seed/main.go

# Output:
# returns by status:
#   FILED: 1
#   ACCEPTED: 2
#   APPROVED: 2
#   SENT: 1
#   COMPLETED: 1
#   REVIEW: 1
```

---

## 🚨 Troubleshooting

### Data Not Seeding

**Check logs:**
```bash
docker-compose logs backend | grep -i seed
```

**Common issues:**
- Data already exists (idempotency check)
- Database connection failed
- DEMO_MODE not set to true
- Migration 000002 not applied

### Clear Stuck Data

```bash
# Connect to database
psql "postgres://demo:demo@localhost:5432/demo?sslmode=disable"

# Clear demo data only
DELETE FROM returns WHERE snap_context->>'demo' = 'true';

# Or clear everything
DELETE FROM returns;
```

### Re-seed After Changes

```bash
# Clear and re-seed in one command
make seed-clear
```

---

## 📚 Related Documentation

- **Main README**: `backend/README.md` - Backend overview
- **Migrations Guide**: `backend/MIGRATIONS.md` - Database migrations
- **Seed Code**: `backend/internal/store/seed.go` - Seed implementation
- **Seed Command**: `backend/cmd/seed/main.go` - Standalone seeder

---

## ✅ Best Practices

1. **Use DEMO_MODE for demos** - Automatically seeds on startup
2. **Use manual seeding for development** - More control
3. **Check before seeding** - Use `make seed-list` to see existing data
4. **Clear when needed** - Use `make seed-clear` for fresh start
5. **Customize for your needs** - Edit `seed.go` for specific scenarios

---

## 🎉 Summary

Demo data seeding provides:

✅ **8 realistic refund scenarios**  
✅ **Multiple status types** (FILED, ACCEPTED, APPROVED, etc.)  
✅ **Realistic timelines** with history  
✅ **Automatic or manual seeding**  
✅ **Idempotent operations**  
✅ **Easy to customize**  
✅ **Docker-ready**  

**Quick start:**
```bash
# Docker (automatic)
docker-compose up --build

# Local (manual)
make seed
```

That's it! Your database is now populated with demo data. 🚀
