-- Drop trigger first
DROP TRIGGER IF EXISTS update_returns_updated_at ON returns;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_returns_created_at;
DROP INDEX IF EXISTS idx_returns_status;
DROP INDEX IF EXISTS idx_returns_filing_id;

-- Drop the main table
DROP TABLE IF EXISTS returns;
