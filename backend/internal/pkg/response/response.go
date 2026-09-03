package response

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"tagira/internal/pkg/errors"
)

type Meta struct {
	Page       int   `json:"page,omitempty"`
	PageSize   int   `json:"page_size,omitempty"`
	TotalItems int64 `json:"total_items,omitempty"`
	TotalPages int   `json:"total_pages,omitempty"`
}

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    any         `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

func Success(c *gin.Context, data any, meta *Meta) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
		Meta:    meta,
	})
}

func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Data:    data,
	})
}

func Error(c *gin.Context, err error) {
	var ae *errors.AppError
	if e, ok := errors.IsAppError(err); ok {
		ae = e
	} else {
		ae = errors.NewInternal(err.Error())
	}

	c.JSON(ae.StatusCode, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    ae.Code,
			Message: ae.Message,
			Details: ae.Details,
		},
	})
}

func FormatTimeWIB(t time.Time, loc *time.Location) string {
	return t.In(loc).Format(time.RFC3339)
}