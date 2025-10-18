package scraper

import (
	"refund-demo/internal/store"

	"github.com/jmoiron/sqlx"
	"github.com/robfig/cron/v3"
	"github.com/rs/zerolog/log"
)

func StartBackgroundJob(db *sqlx.DB) {
	c := cron.New()
	
	// Run every day at midnight
	_, err := c.AddFunc("0 0 * * *", func() {
		log.Info().Msg("Running scheduled scraper job")
		
		// Insert demo data
		returnID, err := store.InsertDemoReturn(db)
		if err != nil {
			log.Error().Err(err).Msg("Failed to insert demo return")
		} else {
			log.Info().Str("return_id", returnID).Msg("Inserted demo return")
		}
	})
	
	if err != nil {
		log.Error().Err(err).Msg("Failed to schedule scraper job")
		return
	}
	
	c.Start()
	log.Info().Msg("Background scraper job started")
}
