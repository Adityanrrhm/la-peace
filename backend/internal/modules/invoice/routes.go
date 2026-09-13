package invoice

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/config"
	"tagira/internal/middleware"
)

func RegisterRoutes(rg *gin.RouterGroup, handler *InvoiceHandler, cfg *config.Config) {
	invoices := rg.Group("/invoices")
	{
		invoices.POST("", middleware.RequireAuth(cfg), handler.Create)
		invoices.GET("", middleware.RequireAuth(cfg), handler.List)
		invoices.GET("/due-today", middleware.RequireAuthOrServiceToken(cfg), handler.GetDueToday)
		invoices.GET("/:id", middleware.RequireAuth(cfg), handler.GetByID)
		invoices.PATCH("/:id/status", middleware.RequireAuth(cfg), handler.UpdateStatus)
	}
}