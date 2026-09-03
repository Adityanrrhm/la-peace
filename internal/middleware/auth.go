package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"tagira/internal/config"
	"tagira/internal/pkg/errors"
	"tagira/internal/pkg/response"
)

type AuthMode string

const (
	AuthModeSession     AuthMode = "session"
	AuthModeServiceToken AuthMode = "service_token"
)

type Claims struct {
	UserID   string   `json:"user_id"`
	Email    string   `json:"email"`
	AuthMode AuthMode `json:"auth_mode"`
	jwt.RegisteredClaims
}

const (
	ContextUserID   = "user_id"
	ContextAuthMode = "auth_mode"
	ContextClaims   = "claims"
)

func AuthMiddleware(cfg *config.Config, allowedModes ...AuthMode) gin.HandlerFunc {
	allowed := make(map[AuthMode]bool)
	for _, m := range allowedModes {
		allowed[m] = true
	}
	if len(allowed) == 0 {
		allowed[AuthModeSession] = true
		allowed[AuthModeServiceToken] = true
	}

	return func(c *gin.Context) {
		// 1. Check Service-Token header (for Hermes)
		if serviceToken := c.GetHeader("X-Service-Token"); serviceToken != "" {
			if serviceToken == cfg.ServiceToken {
				if !allowed[AuthModeServiceToken] {
					response.Error(c, errors.NewForbidden("Service token not allowed for this endpoint"))
					c.Abort()
					return
				}
				c.Set(ContextUserID, "hermes")
				c.Set(ContextAuthMode, AuthModeServiceToken)
				c.Next()
				return
			}
			response.Error(c, errors.NewUnauthorized("Invalid service token"))
			c.Abort()
			return
		}

		// 2. Check session cookie (for dashboard)
		cookie, err := c.Cookie("session_token")
		if err != nil || cookie == "" {
			response.Error(c, errors.NewUnauthorized("Missing authentication"))
			c.Abort()
			return
		}

		claims, err := ParseToken(cookie, cfg)
		if err != nil {
			response.Error(c, errors.NewUnauthorized("Invalid or expired token"))
			c.Abort()
			return
		}

		if !allowed[claims.AuthMode] {
			response.Error(c, errors.NewForbidden("Session not allowed for this endpoint"))
			c.Abort()
			return
		}

		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextAuthMode, claims.AuthMode)
		c.Set(ContextClaims, claims)
		c.Next()
	}
}

func GenerateToken(userID, email string, cfg *config.Config) (string, error) {
	claims := Claims{
		UserID:   userID,
		Email:    email,
		AuthMode: AuthModeSession,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(cfg.JWTExpireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}

func ParseToken(tokenStr string, cfg *config.Config) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.NewUnauthorized("Invalid signing method")
		}
		return []byte(cfg.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.NewUnauthorized("Invalid token")
}

func GetUserID(c *gin.Context) (string, bool) {
	val, exists := c.Get(ContextUserID)
	if !exists {
		return "", false
	}
	return val.(string), true
}

func GetAuthMode(c *gin.Context) (AuthMode, bool) {
	val, exists := c.Get(ContextAuthMode)
	if !exists {
		return "", false
	}
	return val.(AuthMode), true
}

func RequireAuth(cfg *config.Config) gin.HandlerFunc {
	return AuthMiddleware(cfg, AuthModeSession)
}

func RequireServiceToken(cfg *config.Config) gin.HandlerFunc {
	return AuthMiddleware(cfg, AuthModeServiceToken)
}

func OptionalAuth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try service token first
		if serviceToken := c.GetHeader("X-Service-Token"); serviceToken != "" {
			if serviceToken == cfg.ServiceToken {
				c.Set(ContextUserID, "hermes")
				c.Set(ContextAuthMode, AuthModeServiceToken)
				c.Next()
				return
			}
		}

		// Try session cookie
		cookie, err := c.Cookie("session_token")
		if err == nil && cookie != "" {
			if claims, err := ParseToken(cookie, cfg); err == nil {
				c.Set(ContextUserID, claims.UserID)
				c.Set(ContextAuthMode, claims.AuthMode)
				c.Set(ContextClaims, claims)
			}
		}
		c.Next()
	}
}