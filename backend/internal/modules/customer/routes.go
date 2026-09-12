package customer

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/config"
	"tagira/internal/middleware"
)

// Group middleware is permissive (session + service token); writes open to
// service token so Hermes manages customers on owner's Telegram instruction.
func RegisterRoutes(rg *gin.RouterGroup, handler *CustomerHandler, cfg *config.Config) {
	customers := rg.Group("/customers")
	customers.Use(middleware.RequireAny(cfg))
	{
		customers.POST("", handler.Create)
		customers.GET("", handler.List)
		customers.GET("/:id", handler.GetByID)
		customers.PATCH("/:id", handler.Update)
		// DB has ON DELETE RESTRICT from invoices — customer with invoices is rejected here, not silently.
		customers.DELETE("/:id", handler.Delete)
	}
}
