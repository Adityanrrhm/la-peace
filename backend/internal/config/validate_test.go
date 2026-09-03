package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidate_Development(t *testing.T) {
	os.Setenv("APP_ENV", "development")
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "5432")
	os.Setenv("DB_USER", "test")
	os.Setenv("DB_PASSWORD", "test")
	os.Setenv("DB_NAME", "test")
	os.Setenv("DB_SSL_MODE", "disable")
	os.Setenv("SESSION_SECRET", "test_session_secret_32_chars_minimum")
	os.Setenv("JWT_SECRET", "test_jwt_secret_32_chars_minimum__")
	os.Setenv("SERVICE_TOKEN", "test_service_token")
	os.Setenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
	defer cleanupEnv()

	cfg := Load()
	require.NoError(t, Validate(cfg))
}

func TestValidate_Production_MissingRequired(t *testing.T) {
	// Test Validate directly with missing required fields
	cfg := &Config{
		AppEnv:              "production",
		DBHost:              "localhost",
		DBPort:              "5432",
		DBUser:              "test",
		// Missing DBPassword, DBName, etc.
		SessionSecret:       "strong_session_secret_32_chars_minimum",
		JWTSecret:           "strong_jwt_secret_32_chars_minimum__",
		ServiceToken:        "strong_service_token_123",
		CORSAllowedOrigins:  "https://example.com",
	}

	err := Validate(cfg)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "missing required environment variables")
}

func TestValidate_Production_WeakSecrets(t *testing.T) {
	os.Setenv("APP_ENV", "production")
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "5432")
	os.Setenv("DB_USER", "test")
	os.Setenv("DB_PASSWORD", "weak_password")
	os.Setenv("DB_NAME", "test")
	os.Setenv("DB_SSL_MODE", "disable")
	os.Setenv("SESSION_SECRET", "change_me_weak")
	os.Setenv("JWT_SECRET", "change_me_weak_jwt")
	os.Setenv("SERVICE_TOKEN", "change_me_weak_token")
	os.Setenv("CORS_ALLOWED_ORIGINS", "https://example.com")
	defer cleanupEnv()

	cfg := Load()
	// Should not error, just warn
	assert.NoError(t, Validate(cfg))
}

func TestValidate_CORSLocalhostInProduction(t *testing.T) {
	os.Setenv("APP_ENV", "production")
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "5432")
	os.Setenv("DB_USER", "test")
	os.Setenv("DB_PASSWORD", "strong_password_123")
	os.Setenv("DB_NAME", "test")
	os.Setenv("DB_SSL_MODE", "disable")
	os.Setenv("SESSION_SECRET", "strong_session_secret_32_chars_minimum")
	os.Setenv("JWT_SECRET", "strong_jwt_secret_32_chars_minimum__")
	os.Setenv("SERVICE_TOKEN", "strong_service_token_123")
	os.Setenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
	defer cleanupEnv()

	cfg := Load()
	// Should not error, just warn
	assert.NoError(t, Validate(cfg))
}

func cleanupEnv() {
	os.Unsetenv("APP_ENV")
	os.Unsetenv("DB_HOST")
	os.Unsetenv("DB_PORT")
	os.Unsetenv("DB_USER")
	os.Unsetenv("DB_PASSWORD")
	os.Unsetenv("DB_NAME")
	os.Unsetenv("DB_SSL_MODE")
	os.Unsetenv("SESSION_SECRET")
	os.Unsetenv("JWT_SECRET")
	os.Unsetenv("SERVICE_TOKEN")
	os.Unsetenv("CORS_ALLOWED_ORIGINS")
}