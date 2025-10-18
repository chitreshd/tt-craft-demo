# Database Migrations Guide

## 📚 Overview

This project uses **golang-migrate** for version-controlled, production-ready database migrations.

## 🏗️ Architecture

### Migration Files Structure

```
backend/
├── migrations/
│   ├── 000001_create_returns_table.up.sql    ← Applies the change
│   ├── 000001_create_returns_table.down.sql  ← Reverts the change
│   ├── 000002_add_user_table.up.sql
│   └── 000002_add_user_table.down.sql
└── internal/store/db.go                       ← Runs migrations on startup
```

### How It Works

1. **Tracking**: golang-migrate creates a `schema_migrations` table to track applied versions
2. **Sequential**: Migrations run in order (000001, 000002, 000003...)
3. **Idempotent**: Already-applied migrations are skipped
4. **Automatic**: Migrations run automatically when the app starts
5. **Manual**: Can also run migrations manually via CLI

## 🚀 Quick Start

### Creating a New Migration

```bash
# Using Make (recommended)
make migrate-create NAME=add_user_table

# Or directly with migrate CLI
migrate create -ext sql -dir migrations -seq add_user_table
```

This creates two files:
- `000002_add_user_table.up.sql` - Forward migration
- `000002_add_user_table.down.sql` - Rollback migration

### Writing Migration SQL

**Up Migration (`000002_add_user_table.up.sql`):**
```sql
-- Create users table
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key to returns
ALTER TABLE returns ADD COLUMN user_id TEXT REFERENCES users(user_id);

-- Create index
CREATE INDEX idx_returns_user_id ON returns(user_id);

-- Add comment
COMMENT ON TABLE users IS 'Application users';
```

**Down Migration (`000002_add_user_table.down.sql`):**
```sql
-- Remove foreign key column
ALTER TABLE returns DROP COLUMN IF EXISTS user_id;

-- Drop the table
DROP TABLE IF EXISTS users;
```

### Applying Migrations

```bash
# Apply all pending migrations
make migrate-up

# Or specify database explicitly
DB_DSN="postgres://user:pass@host:5432/db?sslmode=disable" make migrate-up
```

### Checking Migration Status

```bash
# Show current version
make migrate-version

# Output: 2 (means migration 000002 is the latest applied)
```

### Rolling Back Migrations

```bash
# Rollback last migration
make migrate-down

# This runs the .down.sql file of the latest migration
```

## 🐳 Docker Integration

### Automatic Migrations on Startup

Migrations run automatically when the Docker container starts:

```yaml
# docker-compose.yml
backend:
  environment:
    - DB_DSN=postgres://demo:demo@postgres:5432/demo?sslmode=disable
    - MIGRATIONS_PATH=file://migrations
  # Migrations run automatically via internal/store/db.go
```

### How Automatic Migrations Work

```go
// internal/store/db.go
func InitPostgres() *sqlx.DB {
    db := connectToDatabase()
    runMigrations(db)  // ← Runs all pending migrations
    return db
}
```

### Manual Migration in Docker

```bash
# Enter the backend container
docker-compose exec backend sh

# Run migrations manually
cd /root
export DB_DSN="postgres://demo:demo@postgres:5432/demo?sslmode=disable"
# (migrations already auto-run on startup)
```

## 🔧 Common Operations

### Force Migration Version (Emergency Only!)

If migrations get stuck in a "dirty" state:

```bash
# Check current state
make migrate-version

# Force to specific version (USE WITH CAUTION!)
make migrate-force VERSION=1

# Then re-apply from that point
make migrate-up
```

### View Migration History in Database

```sql
-- Connect to database
psql -h localhost -U demo -d demo

-- View migration status
SELECT * FROM schema_migrations;

--  version | dirty
-- ---------|-------
--    1     | false
```

## 📋 Migration Best Practices

### ✅ DO

1. **Always write down migrations** - Every `.up.sql` needs a `.down.sql`
2. **Test locally first** - Never deploy untested migrations
3. **Use transactions** - Wrap in `BEGIN`/`COMMIT` when possible
4. **Add comments** - Document why changes are being made
5. **One logical change per migration** - Keep focused
6. **Check for dependencies** - Consider foreign keys and constraints
7. **Use IF EXISTS/IF NOT EXISTS** - Make migrations idempotent where possible

### ❌ DON'T

1. **Never modify existing migrations** - Create new ones to fix issues
2. **Don't run untested migrations in production**
3. **Don't delete old migration files** - History is important
4. **Don't force versions unless emergency** - Can corrupt data
5. **Don't skip the down migration** - Always provide rollback
6. **Don't make breaking changes without planning** - Coordinate with app code

## 🎯 Real-World Examples

### Example 1: Adding a New Column

**Up Migration:**
```sql
ALTER TABLE returns ADD COLUMN notes TEXT;
COMMENT ON COLUMN returns.notes IS 'Internal notes about the return';
```

**Down Migration:**
```sql
ALTER TABLE returns DROP COLUMN IF EXISTS notes;
```

### Example 2: Creating an Index

**Up Migration:**
```sql
CREATE INDEX CONCURRENTLY idx_returns_eta_date ON returns(eta_date)
WHERE eta_date IS NOT NULL;
```

**Down Migration:**
```sql
DROP INDEX IF EXISTS idx_returns_eta_date;
```

### Example 3: Data Migration

**Up Migration:**
```sql
-- Add new column
ALTER TABLE returns ADD COLUMN status_code INTEGER;

-- Migrate existing data
UPDATE returns 
SET status_code = CASE 
  WHEN status = 'FILED' THEN 1
  WHEN status = 'ACCEPTED' THEN 2
  WHEN status = 'APPROVED' THEN 3
  WHEN status = 'SENT' THEN 4
  ELSE 0
END;

-- Make it NOT NULL after data migration
ALTER TABLE returns ALTER COLUMN status_code SET NOT NULL;
```

**Down Migration:**
```sql
ALTER TABLE returns DROP COLUMN IF EXISTS status_code;
```

## 🐛 Troubleshooting

### "Dirty" Database State

**Problem:** Migration failed halfway through, database is marked "dirty"

**Solution:**
```bash
# 1. Check what went wrong
make migrate-version
# Output: error: Dirty database version 2. Fix and force version.

# 2. Manually fix the database issue (e.g., drop partially created table)
psql -h localhost -U demo -d demo
# Fix the issue manually in SQL

# 3. Force the version
make migrate-force VERSION=1

# 4. Try again
make migrate-up
```

### "No Change" Error

**Problem:** `make migrate-up` says "no change"

**Solution:** This is normal - it means all migrations are already applied. Check version with `make migrate-version`.

### Connection Refused

**Problem:** Can't connect to database

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $DB_DSN

# Test connection manually
psql "postgres://demo:demo@localhost:5432/demo?sslmode=disable"
```

### Migration File Not Found (Docker)

**Problem:** Docker can't find migration files

**Solution:** Ensure Dockerfile copies migrations:
```dockerfile
COPY --from=builder /app/migrations ./migrations
ENV MIGRATIONS_PATH=file://migrations
```

## 📊 Migration Workflow in Teams

### Developer Workflow

```bash
# 1. Pull latest code
git pull origin main

# 2. Apply any new migrations
cd backend && make migrate-up

# 3. Create feature branch
git checkout -b feature/add-audit-logs

# 4. Create migration
make migrate-create NAME=add_audit_logs

# 5. Write migration SQL
# Edit migrations/000003_add_audit_logs.up.sql
# Edit migrations/000003_add_audit_logs.down.sql

# 6. Test locally
make migrate-up
# ... test the changes ...
make migrate-down  # Test rollback
make migrate-up    # Re-apply

# 7. Commit and push
git add migrations/
git commit -m "Add audit logs table migration"
git push origin feature/add-audit-logs

# 8. Create PR for review
```

### Code Review Checklist

When reviewing migration PRs:

- [ ] Both `.up.sql` and `.down.sql` files present?
- [ ] Down migration properly reverts the up migration?
- [ ] SQL syntax is correct?
- [ ] No destructive changes without backup plan?
- [ ] Comments explain why (not just what)?
- [ ] Indexes added for new query patterns?
- [ ] Foreign keys have proper constraints?
- [ ] Migration tested locally?

### Production Deployment

```bash
# 1. Backup database first
pg_dump -h production-host -U user -d db > backup.sql

# 2. Deploy code (Docker will auto-run migrations)
docker-compose up --build -d

# 3. Monitor logs
docker-compose logs -f backend
# Look for: "migrations applied successfully"

# 4. Verify schema version
docker-compose exec backend sh
# Check migration version in app logs

# 5. If issues, rollback
docker-compose down
docker-compose up # with previous version
```

## 🔗 Resources

- **golang-migrate docs**: https://github.com/golang-migrate/migrate
- **PostgreSQL ALTER TABLE**: https://www.postgresql.org/docs/current/sql-altertable.html
- **Database migration patterns**: https://www.brunton-spall.co.uk/post/2014/05/06/database-migrations-done-right/

## 🎓 Key Takeaways

1. **Migrations are code** - Treat them with same care as application code
2. **Always reversible** - Write down migrations for every up migration
3. **Test thoroughly** - Migrations can corrupt data if wrong
4. **Version control** - All migrations must be in Git
5. **Automatic in this project** - Migrations run on app startup
6. **Manual control available** - Use Makefile commands when needed

---

**Questions?** Check the main [backend README](./README.md) or the [golang-migrate documentation](https://github.com/golang-migrate/migrate).
