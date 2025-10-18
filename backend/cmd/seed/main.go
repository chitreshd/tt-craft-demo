package main

import (
	"flag"
	"os"

	"refund-demo/internal/store"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Setup logging
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	// Parse command line flags
	clearFlag := flag.Bool("clear", false, "Clear all existing data before seeding")
	dsnFlag := flag.String("dsn", "", "Database connection string (or use DB_DSN env)")
	flag.Parse()

	log.Info().Msg("starting database seeding...")

	// Get database connection string
	dsn := *dsnFlag
	if dsn == "" {
		dsn = os.Getenv("DB_DSN")
	}
	if dsn == "" {
		dsn = "postgres://demo:demo@localhost:5432/demo?sslmode=disable"
	}

	// Connect to database (without running migrations)
	db, err := store.ConnectDB(dsn)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to database")
	}
	defer db.Close()

	log.Info().Msg("connected to database")

	// Clear existing data if requested
	if *clearFlag {
		log.Warn().Msg("clearing all existing returns...")
		if err := store.ClearAllReturns(db); err != nil {
			log.Fatal().Err(err).Msg("failed to clear returns")
		}
		log.Info().Msg("existing data cleared")
	}

	// Seed demo data
	if err := store.SeedDemoData(db); err != nil {
		log.Fatal().Err(err).Msg("failed to seed demo data")
	}

	// Show summary
	returns, err := store.GetAllReturns(db)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch returns")
	} else {
		log.Info().Int("total_returns", len(returns)).Msg("seeding completed successfully")
		
		// Show summary by status
		statusCounts := make(map[string]int)
		for _, r := range returns {
			statusCounts[r.Status]++
		}
		
		log.Info().Msg("returns by status:")
		for status, count := range statusCounts {
			log.Info().Str("status", status).Int("count", count).Msg("")
		}
	}

	log.Info().Msg("✅ demo data seeding complete!")
}
