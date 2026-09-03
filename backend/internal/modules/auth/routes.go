package auth

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/config"
	"tagira/internal/middleware"
)

func RegisterRoutes(rg *gin.RouterGroup, handler *AuthHandler, cfg *config.Config) {
	auth := rg.Group("/auth")
	{
		auth.POST("/login", handler.Login)
		auth.GET("/me", middleware.RequireAuth(cfg), handler.Me)
	}
}