package store

import (
	"encoding/json"
	"time"

	"github.com/jmoiron/sqlx"
)

func GetReturnByID(db *sqlx.DB, id string) (*RefundReturn, error) {
	r := RefundReturn{}
	err := db.Get(&r, "SELECT * FROM returns WHERE return_id=$1", id)
	return &r, err
}

func InsertDemoReturn(db *sqlx.DB) (string, error) {
	now := time.Now()
	history := []RefundHistory{
		{Stage: "FILED", Timestamp: now},
		{Stage: "ACCEPTED", Timestamp: now.Add(24 * time.Hour)},
	}
	histJSON, _ := json.Marshal(history)
	
	returnID := NewULID()
	filingID := NewULID()
	
	_, err := db.Exec(`INSERT INTO returns 
	(return_id, filing_id, status, eta_date, confidence, history, snap_context) 
	VALUES ($1, $2, $3, CURRENT_DATE + interval '10 days', 0.94, $4, '{}'::jsonb)
	ON CONFLICT DO NOTHING`,
		returnID, filingID, "APPROVED", histJSON)
	
	return returnID, err
}
