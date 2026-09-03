package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/rs/zerolog/log"
)

var requiredEnvVars = []string{
	"DB_HOST",
	"DB_PORT",
	"DB_USER",
	"DB_PASSWORD",
	"DB_NAME",
	"SESSION_SECRET",
	"JWT_SECRET",
	"SERVICE_TOKEN",
	"CORS_ALLOWED_ORIGINS",
}

var productionRequiredEnvVars = []string{
	"DB_PASSWORD",
	"SESSION_SECRET",
	"JWT_SECRET",
	"SERVICE_TOKEN",
}

func Validate(cfg *Config) error {
	var missing []string
	var weak []string

	for _, env := range requiredEnvVars {
		val := getEnvValue(cfg, env)
		if val == "" {
			missing = append(missing, env)
		}
	}

	if cfg.AppEnv == "production" {
		for _, env := range productionRequiredEnvVars {
			val := getEnvValue(cfg, env)
			if val == "" {
				missing = append(missing, env)
			} else if isWeakSecret(env, val) {
				weak = append(weak, env)
			}
		}

		if strings.Contains(cfg.CORSAllowedOrigins, "localhost") {
			log.Warn().Msg("CORS_ALLOWED_ORIGINS contains 'localhost' in production")
		}
		if cfg.LogFormat != "json" {
			log.Warn().Str("format", cfg.LogFormat).Msg("LOG_FORMAT should be 'json' in production")
		}
		if cfg.DBSSLMode == "disable" {
			log.Warn().Msg("DB_SSL_MODE is 'disable' in production - consider enabling SSL")
		}
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}

	if len(weak) > 0 {
		log.Warn().Strs("weak_secrets", weak).Msg("Weak secrets detected in production")
	}

	log.Info().Msg("Configuration validation passed")
	return nil
}

func getEnvValue(cfg *Config, env string) string {
	switch env {
	case "DB_HOST":
		return cfg.DBHost
	case "DB_PORT":
		return cfg.DBPort
	case "DB_USER":
		return cfg.DBUser
	case "DB_PASSWORD":
		return cfg.DBPassword
	case "DB_NAME":
		return cfg.DBName
	case "SESSION_SECRET":
		return cfg.SessionSecret
	case "JWT_SECRET":
		return cfg.JWTSecret
	case "SERVICE_TOKEN":
		return cfg.ServiceToken
	case "CORS_ALLOWED_ORIGINS":
		return cfg.CORSAllowedOrigins
	default:
		return os.Getenv(env)
	}
}

func isWeakSecret(env, val string) bool {
	weakPatterns := map[string][]string{
		"SESSION_SECRET":   {"change_me", "secret", "test", "dev", "123456"},
		"JWT_SECRET":       {"change_me", "secret", "test", "dev", "123456"},
		"SERVICE_TOKEN":    {"change_me", "hermes", "test", "dev", "123456"},
		"DB_PASSWORD":      {"tagira_dev", "password", "123456", "postgres"},
	}

	patterns, ok := weakPatterns[env]
	if !ok {
		return false
	}

	valLower := strings.ToLower(val)
	for _, pattern := range patterns {
		if strings.Contains(valLower, pattern) {
			return true
		}
	}
	return false
}