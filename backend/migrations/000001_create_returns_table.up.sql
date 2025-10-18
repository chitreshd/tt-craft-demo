-- Create returns table for tracking tax refund status
CREATE TABLE IF NOT EXISTS returns (
  return_id TEXT PRIMARY KEY,
  filing_id TEXT NOT NULL,
  status TEXT NOT NULL,
  eta_date DATE,
  confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  snap_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_returns_filing_id ON returns(filing_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE returns IS 'Stores tax return refund status and history';
COMMENT ON COLUMN returns.return_id IS 'ULID identifier for the return';
COMMENT ON COLUMN returns.filing_id IS 'ULID identifier for the filing';
COMMENT ON COLUMN returns.status IS 'Current refund status (e.g., FILED, ACCEPTED, APPROVED, SENT)';
COMMENT ON COLUMN returns.eta_date IS 'Estimated refund date';
COMMENT ON COLUMN returns.confidence IS 'Confidence score for the ETA (0.0 to 1.0)';
COMMENT ON COLUMN returns.history IS 'JSON array of status change history';
COMMENT ON COLUMN returns.snap_context IS 'JSON object containing snapshot context data';
