package response

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"tagira/internal/pkg/errors"
)

func TestFormatTimeWIB(t *testing.T) {
	loc, _ := time.LoadLocation("Asia/Jakarta")
	tm := time.Date(2024, 1, 15, 10, 30, 0, 0, time.UTC)
	formatted := FormatTimeWIB(tm, loc)
	assert.Contains(t, formatted, "2024-01-15T17:30:00+07:00")
}

func TestSuccess(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	data := map[string]string{"key": "value"}
	Success(c, data, nil)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCreated(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	data := map[string]string{"key": "value"}
	Created(c, data)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestError_ValidationError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	err := errors.NewValidationError(map[string]string{"email": "required"})
	Error(c, err)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestError_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	err := errors.NewNotFound("User")
	Error(c, err)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestError_Unauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	err := errors.NewUnauthorized("invalid token")
	Error(c, err)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestError_Internal(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	err := errors.NewInternal("db error")
	Error(c, err)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}