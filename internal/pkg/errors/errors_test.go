package errors

import (
	"errors"
	"net/http"
	"testing"
)

func TestNewValidationError(t *testing.T) {
	err := NewValidationError(map[string]string{"field": "required"})
	if err.Code != "VALIDATION_ERROR" {
		t.Errorf("Expected code VALIDATION_ERROR, got %s", err.Code)
	}
	if err.StatusCode != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", err.StatusCode)
	}
}

func TestNewNotFound(t *testing.T) {
	err := NewNotFound("User")
	if err.Code != "NOT_FOUND" {
		t.Errorf("Expected code NOT_FOUND, got %s", err.Code)
	}
	if err.StatusCode != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", err.StatusCode)
	}
	if err.Message != "User not found" {
		t.Errorf("Expected message 'User not found', got %s", err.Message)
	}
}

func TestNewUnauthorized(t *testing.T) {
	err := NewUnauthorized("custom message")
	if err.Code != "UNAUTHORIZED" {
		t.Errorf("Expected code UNAUTHORIZED, got %s", err.Code)
	}
	if err.StatusCode != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", err.StatusCode)
	}
	if err.Message != "custom message" {
		t.Errorf("Expected message 'custom message', got %s", err.Message)
	}
}

func TestNewForbidden(t *testing.T) {
	err := NewForbidden("")
	if err.Code != "FORBIDDEN" {
		t.Errorf("Expected code FORBIDDEN, got %s", err.Code)
	}
	if err.StatusCode != http.StatusForbidden {
		t.Errorf("Expected status 403, got %d", err.StatusCode)
	}
}

func TestNewConflict(t *testing.T) {
	err := NewConflict("duplicate entry")
	if err.Code != "CONFLICT" {
		t.Errorf("Expected code CONFLICT, got %s", err.Code)
	}
	if err.StatusCode != http.StatusConflict {
		t.Errorf("Expected status 409, got %d", err.StatusCode)
	}
}

func TestNewInternal(t *testing.T) {
	err := NewInternal("")
	if err.Code != "INTERNAL_ERROR" {
		t.Errorf("Expected code INTERNAL_ERROR, got %s", err.Code)
	}
	if err.StatusCode != http.StatusInternalServerError {
		t.Errorf("Expected status 500, got %d", err.StatusCode)
	}
}

func TestIsAppError(t *testing.T) {
	appErr := NewValidationError(nil)
	if ae, ok := IsAppError(appErr); !ok {
		t.Error("Expected IsAppError to return true for AppError")
	} else if ae.Code != "VALIDATION_ERROR" {
		t.Errorf("Expected code VALIDATION_ERROR, got %s", ae.Code)
	}

	stdErr := errors.New("standard error")
	if _, ok := IsAppError(stdErr); ok {
		t.Error("Expected IsAppError to return false for standard error")
	}
}