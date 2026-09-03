package auth

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/config"
	"tagira/internal/middleware"
	"tagira/internal/pkg/errors"
	"tagira/internal/pkg/response"
)

type AuthHandler struct {
	svc *AuthService
	cfg *config.Config
}

func NewAuthHandler(svc *AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{svc: svc, cfg: cfg}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.NewValidationError(err.Error()))
		return
	}

	resp, err := h.svc.Login(c.Request.Context(), req)
	if err != nil {
		response.Error(c, errors.NewUnauthorized(err.Error()))
		return
	}

	// Set HttpOnly cookie
	c.SetCookie(
		"session_token",
		resp.Token,
		h.cfg.JWTExpireHours*3600,
		"/",
		"",
		false, // Secure=false for dev, true in production
		true,  // HttpOnly
	)

	response.Success(c, resp, nil)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("user_id")
	claims, _ := c.Get("claims")

	if userClaims, ok := claims.(*middleware.Claims); ok {
		response.Success(c, gin.H{
			"user_id":   userID,
			"email":     userClaims.Email,
			"auth_mode": userClaims.AuthMode,
		}, nil)
		return
	}

	response.Success(c, gin.H{"user_id": userID}, nil)
}