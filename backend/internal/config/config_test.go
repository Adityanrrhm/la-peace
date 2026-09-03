package config

import (
	"os"
	"testing"
	"time"
)

func TestLoad(t *testing.T) {
	os.Setenv("APP_ENV", "development")
	os.Setenv("APP_PORT", "8080")
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "5432")
	os.Setenv("DB_USER", "test")
	os.Setenv("DB_PASSWORD", "test")
	os.Setenv("DB_NAME", "test")
	os.Setenv("DB_SSL_MODE", "disable")
	os.Setenv("SESSION_SECRET", "test_secret_32_chars_minimum_length")
	os.Setenv("JWT_SECRET", "test_jwt_secret_32_chars_minimum")
	os.Setenv("SERVICE_TOKEN", "test_service_token")
	defer os.Unsetenv("APP_ENV")
	defer os.Unsetenv("APP_PORT")
	defer os.Unsetenv("DB_HOST")
	defer os.Unsetenv("DB_PORT")
	defer os.Unsetenv("DB_USER")
	defer os.Unsetenv("DB_PASSWORD")
	defer os.Unsetenv("DB_NAME")
	defer os.Unsetenv("DB_SSL_MODE")
	defer os.Unsetenv("SESSION_SECRET")
	defer os.Unsetenv("JWT_SECRET")
	defer os.Unsetenv("SERVICE_TOKEN")

	cfg := Load()

	if cfg.AppEnv != "development" {
		t.Errorf("Expected AppEnv=development, got %s", cfg.AppEnv)
	}
	if cfg.AppPort != "8080" {
		t.Errorf("Expected AppPort=8080, got %s", cfg.AppPort)
	}
	if cfg.DBHost != "localhost" {
		t.Errorf("Expected DBHost=localhost, got %s", cfg.DBHost)
	}
	if cfg.WIBLocation == nil {
		t.Error("Expected WIBLocation to be set")
	}
	if _, err := time.LoadLocation("Asia/Jakarta"); err != nil {
		t.Errorf("WIB location not loadable: %v", err)
	}
}

func TestGetDSN(t *testing.T) {
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "5432")
	os.Setenv("DB_USER", "test")
	os.Setenv("DB_PASSWORD", "test")
	os.Setenv("DB_NAME", "test")
	os.Setenv("DB_SSL_MODE", "disable")
	defer os.Unsetenv("DB_HOST")
	defer os.Unsetenv("DB_PORT")
	defer os.Unsetenv("DB_USER")
	defer os.Unsetenv("DB_PASSWORD")
	defer os.Unsetenv("DB_NAME")
	defer os.Unsetenv("DB_SSL_MODE")

	cfg := &Config{
		DBHost:     "localhost",
		DBPort:     "5432",
		DBUser:     "test",
		DBPassword: "test",
		DBName:     "test",
		DBSSLMode:  "disable",
	}

	dsn := cfg.GetDSN()
	expected := "postgres://test:test@localhost:5432/test?sslmode=disable"
	if dsn != expected {
		t.Errorf("Expected DSN=%s, got %s", expected, dsn)
	}
}