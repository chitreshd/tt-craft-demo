package store

import (
	"encoding/json"
	"time"
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
