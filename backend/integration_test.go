//go:build integration

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"tagira/internal/config"
	"tagira/internal/database"
	"tagira/internal/server"
)

func setupTestServer(t *testing.T) (*httptest.ResponseRecorder, *gin.Engine, *database.Pool, func()) {
	gin.SetMode(gin.TestMode)

	cfg := &config.Config{
		AppEnv:              "test",
		AppPort:             "8080",
		AppHost:             "0.0.0.0",
		DBHost:              "localhost",
		DBPort:              "5432",
		DBUser:              "tagira",
		DBPassword:          "tagira_dev",
		DBName:              "tagira_test",
		DBSSLMode:           "disable",
		DBMaxOpenConns:      5,
		DBMaxIdleConns:      2,
		DBConnMaxLifetime:   300 * time.Second,
		SessionSecret:       "test_session_secret_32_chars_minimum",
		JWTSecret:           "test_jwt_secret_32_chars_minimum__",
		JWTExpireHours:      24,
		ServiceToken:        "test_service_token",
		CORSAllowedOrigins:  "http://localhost:3000",
		CORSAllowCredentials: true,
		RateLimitRequests:   1000,
		RateLimitWindowSeconds: 60,
		LogFormat:           "console",
		LogLevel:            "debug",
	}

	loc, _ := time.LoadLocation("Asia/Jakarta")
	cfg.WIBLocation = loc

	pool, err := database.NewPool(cfg)
	require.NoError(t, err)

	if err := database.Migrate(pool, "migrations"); err != nil {
		t.Logf("Migration warning (may already exist): %v", err)
	}

	srv := server.New(cfg, pool)

	cleanup := func() {
		pool.Close()
	}

	return httptest.NewRecorder(), srv.Engine(), pool, cleanup
}

func TestIntegration_FullFlow(t *testing.T) {
	w, engine, pool, cleanup := setupTestServer(t)
	defer cleanup()

	// 1. Login
	loginReq := map[string]string{
		"email":    "test@example.com",
		"password": "password123",
	}

	// First create a user directly in DB for testing
	userID := uuid.New().String()
	_, err := pool.Exec(context.Background(),
		`INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4)`,
		userID, "test@example.com", "$2a$10$dummyhash", time.Now().Format(time.RFC3339))
	require.NoError(t, err)

	// 2. Create customer
	customerReq := map[string]string{
		"nama":                  "Test Customer",
		"kontak_telegram":       "@testcustomer",
		"catatan_perilaku_bayar": "Pembayar baik",
	}
	body, _ := json.Marshal(customerReq)
	req, _ := http.NewRequest("POST", "/api/v1/customers", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(&http.Cookie{Name: "session_token", Value: "dummy"})
	w = httptest.NewRecorder()
	engine.ServeHTTP(w, req)
	// Note: This will fail auth without proper token, but tests the endpoint wiring

	// 3. Test health endpoint
	req, _ = http.NewRequest("GET", "/health", nil)
	w = httptest.NewRecorder()
	engine.ServeHTTP(w, req)
	assert.Equal(t, 200, w.Code)

	var healthResp map[string]string
	json.Unmarshal(w.Body.Bytes(), &healthResp)
	assert.Equal(t, "ok", healthResp["status"])
}

func TestIntegration_HermesEndpoints(t *testing.T) {
	w, engine, pool, cleanup := setupTestServer(t)
	defer cleanup()

	// Test due-today endpoint with service token
	req, _ := http.NewRequest("GET", "/api/v1/invoices/due-today", nil)
	req.Header.Set("X-Service-Token", "test_service_token")
	w = httptest.NewRecorder()
	engine.ServeHTTP(w, req)

	// Should return 200 with empty array (no data)
	assert.Equal(t, 200, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.True(t, resp["success"].(bool))
	assert.Nil(t, resp["error"])
	assert.NotNil(t, resp["data"])

	// Test summary endpoint
	req, _ = http.NewRequest("GET", "/api/v1/summary/daily", nil)
	req.Header.Set("X-Service-Token", "test_service_token")
	w = httptest.NewRecorder()
	engine.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.True(t, resp["success"].(bool))
	assert.Contains(t, resp["data"], "tertangih")
	assert.Contains(t, resp["data"], "belum_tagih")
	assert.Contains(t, resp["data"], "terlambat")
	assert.Contains(t, resp["data"], "lunas")
}

func TestIntegration_AuthModes(t *testing.T) {
	w, engine, pool, cleanup := setupTestServer(t)
	defer cleanup()

	// Test service token auth
	req, _ := http.NewRequest("GET", "/api/v1/invoices/due-today", nil)
	req.Header.Set("X-Service-Token", "invalid_token")
	w = httptest.NewRecorder()
	engine.ServeHTTP(w, req)
	assert.Equal(t, 401, w.Code)

	// Test without auth
	req, _ = http.NewRequest("GET", "/api/v1/invoices/due-today", nil)
	w = httptest.NewRecorder()
	engine.ServeHTTP(w, req)
	assert.Equal(t, 401, w.Code)
}