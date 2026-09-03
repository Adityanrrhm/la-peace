package main

import (
	"context"
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
	cfg := config.Load()

	pool, err := database.NewPool(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}
	defer pool.Close()

	if err := database.Migrate(pool, "migrations"); err != nil {
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

	_ = ctx
	log.Info().Msg("Server exited")
}