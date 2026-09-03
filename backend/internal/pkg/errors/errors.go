package errors

import "net/http"

type AppError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	StatusCode int    `json:"-"`
	Details    any    `json:"details,omitempty"`
}

func (e *AppError) Error() string {
	return e.Message
}

func NewValidationError(details any) *AppError {
	return &AppError{
		Code:       "VALIDATION_ERROR",
		Message:    "Validation failed",
		StatusCode: http.StatusBadRequest,
		Details:    details,
	}
}

func NewNotFound(resource string) *AppError {
	return &AppError{
		Code:       "NOT_FOUND",
		Message:    resource + " not found",
		StatusCode: http.StatusNotFound,
	}
}

func NewUnauthorized(message string) *AppError {
	if message == "" {
		message = "Unauthorized"
	}
	return &AppError{
		Code:       "UNAUTHORIZED",
		Message:    message,
		StatusCode: http.StatusUnauthorized,
	}
}

func NewForbidden(message string) *AppError {
	if message == "" {
		message = "Forbidden"
	}
	return &AppError{
		Code:       "FORBIDDEN",
		Message:    message,
		StatusCode: http.StatusForbidden,
	}
}

func NewConflict(message string) *AppError {
	return &AppError{
		Code:       "CONFLICT",
		Message:    message,
		StatusCode: http.StatusConflict,
	}
}

func NewInternal(message string) *AppError {
	if message == "" {
		message = "Internal server error"
	}
	return &AppError{
		Code:       "INTERNAL_ERROR",
		Message:    message,
		StatusCode: http.StatusInternalServerError,
	}
}

func IsAppError(err error) (*AppError, bool) {
	if ae, ok := err.(*AppError); ok {
		return ae, true
	}
	return nil, false
}