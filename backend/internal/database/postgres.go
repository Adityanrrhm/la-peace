package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/golang-migrate/migrate/v4"
	pgxmigrate "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/jackc/pgx/v5/stdlib" // register "pgx" driver untuk sql.Open
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"

	"tagira/internal/config"
)

type Pool = pgxpool.Pool

func NewPool(cfg *config.Config) (*Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(cfg.GetDSN())
	if err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}

	poolConfig.MaxConns = int32(cfg.DBMaxOpenConns)
	poolConfig.MinConns = int32(cfg.DBMaxIdleConns)
	poolConfig.MaxConnLifetime = cfg.DBConnMaxLifetime
	poolConfig.MaxConnIdleTime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping: %w", err)
	}

	log.Info().Msg("Database connection pool established")
	return pool, nil
}

// Migrate menjalankan migrasi UP menggunakan koneksi mandiri (bukan pool aplikasi).
// Dengan cara ini pool.Close() tidak akan pernah diblokir oleh sisa koneksi migration.
func Migrate(dsn, migrationsPath string) error {
	// Buat koneksi sql.DB mandiri — TIDAK berbagi pool dengan aplikasi
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("open migration db: %w", err)
	}
	defer db.Close()

	driver, err := pgxmigrate.WithInstance(db, &pgxmigrate.Config{MigrationsTable: "schema_migrations"})
	if err != nil {
		return fmt.Errorf("create driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://"+migrationsPath,
		"pgx", driver)
	if err != nil {
		return fmt.Errorf("create migrate instance: %w", err)
	}
	defer m.Close() // lepas advisory lock sebelum db.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrate up: %w", err)
	}

	log.Info().Msg("Database migrations applied")
	return nil
}

// MigrateDown menjalankan rollback menggunakan koneksi mandiri (bukan pool aplikasi).
func MigrateDown(dsn, migrationsPath string, steps int) error {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("open migration db: %w", err)
	}
	defer db.Close()

	driver, err := pgxmigrate.WithInstance(db, &pgxmigrate.Config{MigrationsTable: "schema_migrations"})
	if err != nil {
		return fmt.Errorf("create driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://"+migrationsPath,
		"pgx", driver)
	if err != nil {
		return fmt.Errorf("create migrate instance: %w", err)
	}
	defer m.Close()

	if err := m.Steps(-steps); err != nil {
		return fmt.Errorf("migrate down: %w", err)
	}

	log.Info().Int("steps", steps).Msg("Database migrations rolled back")
	return nil
}

func HealthCheck(ctx context.Context, pool *pgxpool.Pool) error {
	return pool.Ping(ctx)
}