package config

import (
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

type Config struct {
	AppEnv           string        `mapstructure:"APP_ENV" validate:"required,oneof=development production"`
	AppPort          string        `mapstructure:"APP_PORT" validate:"required"`
	AppHost          string        `mapstructure:"APP_HOST" validate:"required"`
	DBHost           string        `mapstructure:"DB_HOST" validate:"required"`
	DBPort           string        `mapstructure:"DB_PORT" validate:"required"`
	DBUser           string        `mapstructure:"DB_USER" validate:"required"`
	DBPassword       string        `mapstructure:"DB_PASSWORD" validate:"required"`
	DBName           string        `mapstructure:"DB_NAME" validate:"required"`
	DBSSLMode        string        `mapstructure:"DB_SSL_MODE" validate:"required"`
	DBMaxOpenConns   int           `mapstructure:"DB_MAX_OPEN_CONNS" validate:"min=1"`
	DBMaxIdleConns   int           `mapstructure:"DB_MAX_IDLE_CONNS" validate:"min=1"`
	DBConnMaxLifetime time.Duration `mapstructure:"DB_CONN_MAX_LIFETIME" validate:"min=1"`
	SessionSecret    string        `mapstructure:"SESSION_SECRET" validate:"required,min=32"`
	JWTSecret        string        `mapstructure:"JWT_SECRET" validate:"required,min=32"`
	JWTExpireHours   int           `mapstructure:"JWT_EXPIRE_HOURS" validate:"min=1"`
	ServiceToken     string        `mapstructure:"SERVICE_TOKEN" validate:"required"`
	CORSAllowedOrigins  string `mapstructure:"CORS_ALLOWED_ORIGINS" validate:"required"`
	CORSAllowCredentials bool   `mapstructure:"CORS_ALLOW_CREDENTIALS"`
	CookieDomain        string `mapstructure:"COOKIE_DOMAIN"`
	RateLimitRequests int          `mapstructure:"RATE_LIMIT_REQUESTS" validate:"min=1"`
	RateLimitWindowSeconds int     `mapstructure:"RATE_LIMIT_WINDOW_SECONDS" validate:"min=1"`
	FrontendDir      string        `mapstructure:"FRONTEND_DIR"`
	LogFormat        string        `mapstructure:"LOG_FORMAT" validate:"oneof=json console"`
	LogLevel         string        `mapstructure:"LOG_LEVEL" validate:"oneof=debug info warn error"`
	WIBLocation      *time.Location
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Warn().Err(err).Msg("No .env file found, using environment variables")
	}

	cfg := &Config{
		AppEnv:              getEnv("APP_ENV", "development"),
		AppPort:             getEnv("APP_PORT", "8080"),
		AppHost:             getEnv("APP_HOST", "0.0.0.0"),
		DBHost:              getEnv("DB_HOST", "localhost"),
		DBPort:              getEnv("DB_PORT", "5432"),
		DBUser:              getEnv("DB_USER", "tagira"),
		DBPassword:          getEnv("DB_PASSWORD", "tagira_dev"),
		DBName:              getEnv("DB_NAME", "tagira"),
		DBSSLMode:           getEnv("DB_SSL_MODE", "disable"),
		DBMaxOpenConns:      getEnvInt("DB_MAX_OPEN_CONNS", 10),
		DBMaxIdleConns:      getEnvInt("DB_MAX_IDLE_CONNS", 5),
		DBConnMaxLifetime:   time.Duration(getEnvInt("DB_CONN_MAX_LIFETIME", 300)) * time.Second,
		SessionSecret:       getEnv("SESSION_SECRET", "change_me_32_chars_minimum_length"),
		JWTSecret:           getEnv("JWT_SECRET", "change_me_32_chars_minimum_length_for_jwt"),
		JWTExpireHours:      getEnvInt("JWT_EXPIRE_HOURS", 24),
		ServiceToken:        getEnv("SERVICE_TOKEN", "hermes_service_token_change_me"),
		CORSAllowedOrigins:   getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000"),
		CORSAllowCredentials: getEnvBool("CORS_ALLOW_CREDENTIALS", true),
		CookieDomain:         getEnv("COOKIE_DOMAIN", ""),
		RateLimitRequests:   getEnvInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindowSeconds: getEnvInt("RATE_LIMIT_WINDOW_SECONDS", 60),
		FrontendDir:         getEnv("FRONTEND_DIR", ""),
		LogFormat:           getEnv("LOG_FORMAT", "console"),
		LogLevel:            getEnv("LOG_LEVEL", "info"),
	}

	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load WIB timezone")
	}
	cfg.WIBLocation = loc

	if err := Validate(cfg); err != nil {
		log.Fatal().Err(err).Msg("Configuration validation failed")
	}

	return cfg
}

func (c *Config) GetDSN() string {
	return "postgres://" + c.DBUser + ":" + url.QueryEscape(c.DBPassword) + "@" + c.DBHost + ":" + c.DBPort + "/" + c.DBName + "?sslmode=" + c.DBSSLMode
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if result, err := strconv.Atoi(value); err == nil {
			return result
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		return value == "true" || value == "1"
	}
	return defaultValue
}