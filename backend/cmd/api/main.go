package main

import (
	"context"
	"flag"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog/log"

	"tagira/internal/config"
	"tagira/internal/database"
	"tagira/internal/server"
)

func main() {
	// CLI flags
	migrateFlag := flag.Bool("migrate", false, "Run database migrations")
	migrateDownFlag := flag.Int("migrate-down", 0, "Rollback migrations (specify steps)")
	validateFlag := flag.Bool("validate", false, "Validate configuration and exit")
	flag.Parse()

	cfg := config.Load()

	if *validateFlag {
		log.Info().Msg("Configuration validation passed")
		return
	}

	pool, err := database.NewPool(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}

	// Handle migration commands
	if *migrateFlag {
		if err := database.Migrate(cfg.GetDSN(), "migrations"); err != nil {
			log.Fatal().Err(err).Msg("Failed to run migrations")
		}
		log.Info().Msg("Migrations completed successfully")
		return
	}

	if *migrateDownFlag > 0 {
		if err := database.MigrateDown(cfg.GetDSN(), "migrations", *migrateDownFlag); err != nil {
			log.Fatal().Err(err).Msg("Failed to rollback migrations")
		}
		log.Info().Int("steps", *migrateDownFlag).Msg("Migrations rolled back successfully")
		return
	}

	// Run server — migrate otomatis saat startup
	if err := database.Migrate(cfg.GetDSN(), "migrations"); err != nil {
		log.Fatal().Err(err).Msg("Failed to run migrations")
	}

	srv := server.New(cfg, pool)

	go func() {
		if err := srv.Run(cfg.AppHost + ":" + cfg.AppPort); err != nil {
			log.Fatal().Err(err).Msg("Server failed to start")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("Server forced to shutdown")
	}
	pool.Close()
	log.Info().Msg("Server exited")
}