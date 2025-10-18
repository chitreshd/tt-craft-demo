package store

import (
	"os"
	"strings"
	
	_ "github.com/lib/pq"
	"github.com/jmoiron/sqlx"
	"github.com/rs/zerolog/log"
	
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// ConnectDB connects to the database without running migrations
func ConnectDB(dsn string) (*sqlx.DB, error) {
	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		return nil, err
	}
	return db, nil
}

func InitPostgres() *sqlx.DB {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = "postgres://demo:demo@localhost:5432/demo?sslmode=disable"
	}
	
	db, err := ConnectDB(dsn)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to postgres")
	}
	
	log.Info().Msg("connected to postgres")
	
	// Run migrations
	if err := runMigrations(db); err != nil {
		log.Fatal().Err(err).Msg("failed to run migrations")
	}
	
	// Seed demo data if DEMO_MODE is enabled
	if isDemoMode() {
		log.Info().Msg("demo mode enabled - seeding data")
		if err := SeedDemoData(db); err != nil {
			log.Error().Err(err).Msg("failed to seed demo data")
		}
	}
	
	return db
}

// isDemoMode checks if demo mode is enabled
func isDemoMode() bool {
	demoMode := os.Getenv("DEMO_MODE")
	return strings.ToLower(demoMode) == "true" || demoMode == "1"
}

func runMigrations(db *sqlx.DB) error {
	// Get migrations path from env or use default
	migrationsPath := os.Getenv("MIGRATIONS_PATH")
	if migrationsPath == "" {
		migrationsPath = "file://migrations"
	}
	
	driver, err := postgres.WithInstance(db.DB, &postgres.Config{})
	if err != nil {
		return err
	}
	
	m, err := migrate.NewWithDatabaseInstance(
		migrationsPath,
		"postgres",
		driver,
	)
	if err != nil {
		return err
	}
	
	// Run all up migrations
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}
	
	version, dirty, err := m.Version()
	if err != nil && err != migrate.ErrNilVersion {
		return err
	}
	
	if dirty {
		log.Warn().Uint("version", version).Msg("database is in dirty state")
	} else if err == nil {
		log.Info().Uint("version", version).Msg("migrations applied successfully")
	} else {
		log.Info().Msg("no migrations applied yet")
	}
	
	return nil
}
