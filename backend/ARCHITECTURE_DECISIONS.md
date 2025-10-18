# Architecture Decisions

## ADR-001: Seed Data Strategy

**Date:** 2025-10-17  
**Status:** Accepted  
**Decision Maker:** Backend Team  

### Context

We need to populate the database with demo data for testing and demonstrations. There are multiple approaches:

1. **Migration-based seeding** - SQL files in migrations/
2. **Go-based seeding** - Code in internal/store/seed.go
3. **Hybrid approach** - Both methods

### Decision

We will use **Go-based seeding only** via `internal/store/seed.go` and NOT use migrations for seed data.

### Rationale

#### Why Go-based?

✅ **Flexibility**
- Easy to add complex logic
- Can generate dynamic data
- Reusable functions

✅ **Control**
- DEMO_MODE environment variable
- Manual via `make seed`
- Standalone command available

✅ **Maintainability**
- Single source of truth
- Type-safe with Go structs
- Better error handling
- Structured logging

✅ **Separation of Concerns**
- Migrations = Schema changes (DDL)
- Seed code = Data population (DML)
- Clear responsibility boundaries

#### Why NOT migration-based?

❌ **Limited flexibility**
- Hard to maintain complex SQL logic
- Difficult to generate dynamic data
- Can't easily reuse logic

❌ **Wrong responsibility**
- Migrations should handle schema evolution
- Mixing schema and data concerns is confusing
- Makes migration history cluttered

❌ **Environment issues**
- Seeds would run in ALL environments (dev/staging/prod)
- Need complex conditional logic in SQL
- Hard to control when it runs

### Implementation

**Seeding Methods:**

1. **Automatic (Docker)**
   ```yaml
   environment:
     - DEMO_MODE=true
   ```

2. **Manual (Development)**
   ```bash
   make seed
   make seed-clear
   ```

3. **Standalone Command**
   ```bash
   go run cmd/seed/main.go
   ```

**Code Location:**
- `internal/store/seed.go` - Seeding logic
- `cmd/seed/main.go` - Standalone command
- `internal/store/db.go` - DEMO_MODE check

### Consequences

**Positive:**
- Clear separation: migrations for schema, code for data
- More flexible seeding options
- Better control over when/how to seed
- Easier to maintain and extend
- Type-safe data generation

**Negative:**
- Seed data not tracked in migration history
- Need to remember to run seeding separately (unless DEMO_MODE)
- Requires Go knowledge to modify seed data

### Alternatives Considered

#### Alternative 1: Migration-based seeding
```sql
-- migrations/000002_seed_demo_data.up.sql
INSERT INTO returns (...) VALUES (...);
```

**Rejected because:**
- Too rigid for complex data
- Clutters migration history
- Runs in all environments (or needs complex conditionals)

#### Alternative 2: Hybrid approach
Use both migrations and Go code.

**Rejected because:**
- Duplication and confusion
- Two sources of truth
- Maintenance burden

### References

- **Seed Implementation:** `backend/internal/store/seed.go`
- **Documentation:** `backend/DEMO_DATA.md`
- **Related ADRs:** None yet

---

## ADR-002: Migration Tool Choice

**Date:** 2025-10-17  
**Status:** Accepted  

### Context

Need a database migration tool for schema evolution.

### Decision

Use **golang-migrate** for database migrations.

### Rationale

✅ Industry standard  
✅ Simple SQL-based migrations  
✅ Up/down migration support  
✅ CLI and library support  
✅ Active community  

### Implementation

- Migrations in `backend/migrations/`
- Auto-run on app startup via `db.go`
- Manual control via Makefile

### References

- **Migration Guide:** `backend/MIGRATIONS.md`
- **Code:** `backend/internal/store/db.go`

---

## Future ADRs

Topics to document:

- ADR-003: ULID vs UUID for IDs
- ADR-004: Fiber vs Gin vs Echo for web framework
- ADR-005: JSONB vs separate tables for history
- ADR-006: SSE vs WebSocket for streaming
- ADR-007: Structured logging with Zerolog
