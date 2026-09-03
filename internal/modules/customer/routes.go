package customer

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/config"
	"tagira/internal/middleware"
)

func RegisterRoutes(rg *gin.RouterGroup, handler *CustomerHandler, cfg *config.Config) {
	customers := rg.Group("/customers")
	customers.Use(middleware.RequireAuth(cfg))
	{
		customers.POST("", handler.Create)
		customers.GET("", handler.List)
		customers.GET("/:id", handler.GetByID)
		customers.PATCH("/:id", handler.Update)
		customers.DELETE("/:id", handler.Delete)
	}
}