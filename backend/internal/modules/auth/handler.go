package auth

import (
	"net/http"

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

// setSessionCookie menyetel cookie session_token dengan atribut yang benar.
// SameSite=Lax cocok saat frontend dan backend diakses lewat proxy (same-origin).
// Jika diakses cross-origin langsung (tanpa proxy), gunakan SameSite=None + Secure=true.
func (h *AuthHandler) setSessionCookie(c *gin.Context, token string, maxAge int) {
	sameSite := http.SameSiteLaxMode
	secure := false

	if h.cfg.AppEnv == "production" && c.Request.TLS != nil {
		secure = true
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		MaxAge:   maxAge,
		Path:     "/",
		Domain:   h.cfg.CookieDomain,
		Secure:   secure,
		HttpOnly: true,
		SameSite: sameSite,
	})
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

	h.setSessionCookie(c, resp.Token, h.cfg.JWTExpireHours*3600)
	response.Success(c, resp, nil)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Hapus cookie dengan MaxAge=0 (expired immediately)
	h.setSessionCookie(c, "", -1)
	response.Success(c, gin.H{"message": "Berhasil keluar"}, nil)
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