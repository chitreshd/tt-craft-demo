package store

import (
	"encoding/json"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/rs/zerolog/log"
)

// DemoReturn represents a demo tax return with predefined data
type DemoReturn struct {
	Status      string
	EtaDate     *time.Time
	Confidence  float64
	History     []RefundHistory
	Description string
}

// SeedDemoData populates the database with realistic demo data
func SeedDemoData(db *sqlx.DB) error {
	log.Info().Msg("seeding demo data...")

	// Check if data already exists
	var count int
	err := db.Get(&count, "SELECT COUNT(*) FROM returns")
	if err != nil {
		return err
	}

	if count > 0 {
		log.Info().Int("existing_records", count).Msg("demo data already exists, skipping seed")
		return nil
	}

	// Create demo returns with various statuses
	demoReturns := []DemoReturn{
		// 1. Recently filed return - awaiting IRS acceptance
		{
			Status:      "FILED",
			EtaDate:     datePtr(time.Now().AddDate(0, 0, 21)), // 21 days from now
			Confidence:  0.85,
			History:     []RefundHistory{{Stage: "FILED", Timestamp: time.Now().AddDate(0, 0, -2)}},
			Description: "Recently filed return",
		},
		// 2. Accepted return - under review
		{
			Status:      "ACCEPTED",
			EtaDate:     datePtr(time.Now().AddDate(0, 0, 14)), // 14 days from now
			Confidence:  0.88,
			History: []RefundHistory{
				{Stage: "FILED", Timestamp: time.Now().AddDate(0, 0, -7)},
				{Stage: "ACCEPTED", Timestamp: time.Now().AddDate(0, 0, -5)},
			},
			Description: "Accepted and under review",
		},
		// 3. Approved return - processing payment
		{
			Status:      "APPROVED",
			EtaDate:     datePtr(time.Now().AddDate(0, 0, 7)), // 7 days from now
			Confidence:  0.94,
			History: []RefundHistory{
				{Stage: "FILED", Timestamp: time.Now().AddDate(0, 0, -14)},
				{Stage: "ACCEPTED", Timestamp: time.Now().AddDate(0, 0, -12)},
				{Stage: "APPROVED", Timestamp: time.Now().AddDate(0, 0, -3)},
			},
			Description: "Approved and payment processing",
		},
		// 4. Sent - refund on the way
		{
			Status:      "SENT",
			EtaDate:     datePtr(time.Now().AddDate(0, 0, 2)), // 2 days from now
			Confidence:  0.98,
			History: []RefundHistory{
				{Stage: "FILED", Timestamp: time.Now().AddDate(0, 0, -21)},
				{Stage: "ACCEPTED", Timestamp: time.Now().AddDate(0, 0, -19)},
				{Stage: "APPROVED", Timestamp: time.Now().AddDate(0, 0, -5)},
				{Stage: "SENT", Timestamp: time.Now().AddDate(0, 0, -1)},
			},
			Description: "Refund sent - arriving soon",
		},
		// 5. Completed - refund received
		{
			Status:      "COMPLETED",
			EtaDate:     datePtr(time.Now().AddDate(0, 0, -3)), // 3 days ago
			Confidence:  1.0,
			History: []RefundHistory{
				{Stage: "FILED", Timestamp: time.Now().AddDate(0, 0, -30)},
				{Stage: "ACCEPTED", Timestamp: time.Now().AddDate(0, 0, -28)},
				{Stage: "APPROVED", Timestamp: time.Now().AddDate(0, 0, -10)},
				{Stage: "SENT", Timestamp: time.Now().AddDate(0, 0, -5)},
				{Stage: "COMPLETED", Timestamp: time.Now().AddDate(0, 0, -3)},
			},
			Description: "Refund completed",
		},
		// 6. Under additional review - delayed
		{
			Status:      "REVIEW",
			EtaDate:     datePtr(time.Now().AddDate(0, 0, 28)), // 28 days from now
			Confidence:  0.72,
			History: []RefundHistory{
				{Stage: "FILED", Timestamp: time.Now().AddDate(0, 0, -15)},
				{Stage: "ACCEPTED", Timestamp: time.Now().AddDate(0, 0, -13)},
				{Stage: "REVIEW", Timestamp: time.Now().AddDate(0, 0, -5)},
			},
			Description: "Under additional review",
		},
		// 7. Early filer - high income
		{
			Status:      "ACCEPTED",
			EtaDate:     datePtr(time.Now().AddDate(0, 0, 18)), // 18 days from now
			Confidence:  0.91,
			History: []RefundHistory{
				{Stage: "FILED", Timestamp: time.Now().AddDate(0, 0, -10)},
				{Stage: "ACCEPTED", Timestamp: time.Now().AddDate(0, 0, -8)},
			},
			Description: "Early filer with high income",
		},
		// 8. Standard return - on track
		{
			Status:      "APPROVED",
			EtaDate:     datePtr(time.Now().AddDate(0, 0, 10)), // 10 days from now
			Confidence:  0.92,
			History: []RefundHistory{
				{Stage: "FILED", Timestamp: time.Now().AddDate(0, 0, -12)},
				{Stage: "ACCEPTED", Timestamp: time.Now().AddDate(0, 0, -10)},
				{Stage: "APPROVED", Timestamp: time.Now().AddDate(0, 0, -2)},
			},
			Description: "Standard return on track",
		},
	}

	// Insert all demo returns
	for i, demoReturn := range demoReturns {
		returnID := NewULID()
		filingID := NewULID()

		// Serialize history to JSON
		historyJSON, err := json.Marshal(demoReturn.History)
		if err != nil {
			log.Error().Err(err).Int("index", i).Msg("failed to marshal history")
			continue
		}

		// Create snapshot context with demo metadata
		snapContext := map[string]interface{}{
			"demo":        true,
			"description": demoReturn.Description,
			"scenario":    i + 1,
			"amount":      5000 + (i * 500), // Varying refund amounts
		}
		snapJSON, err := json.Marshal(snapContext)
		if err != nil {
			log.Error().Err(err).Int("index", i).Msg("failed to marshal snap_context")
			continue
		}

		// Insert into database
		_, err = db.Exec(`
			INSERT INTO returns 
			(return_id, filing_id, status, eta_date, confidence, history, snap_context) 
			VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			returnID, filingID, demoReturn.Status, demoReturn.EtaDate,
			demoReturn.Confidence, historyJSON, snapJSON,
		)

		if err != nil {
			log.Error().Err(err).Int("index", i).Str("status", demoReturn.Status).Msg("failed to insert demo return")
			continue
		}

		log.Info().
			Int("scenario", i+1).
			Str("return_id", returnID).
			Str("status", demoReturn.Status).
			Str("description", demoReturn.Description).
			Msg("inserted demo return")
	}

	log.Info().Int("count", len(demoReturns)).Msg("demo data seeded successfully")
	return nil
}

// GetAllReturns retrieves all returns from the database
func GetAllReturns(db *sqlx.DB) ([]RefundReturn, error) {
	var returns []RefundReturn
	err := db.Select(&returns, "SELECT * FROM returns ORDER BY created_at DESC")
	return returns, err
}

// ClearAllReturns removes all returns from the database (use with caution!)
func ClearAllReturns(db *sqlx.DB) error {
	_, err := db.Exec("DELETE FROM returns")
	if err != nil {
		return err
	}
	log.Info().Msg("cleared all returns from database")
	return nil
}

// Helper function to create a date pointer
func datePtr(t time.Time) *time.Time {
	return &t
}
