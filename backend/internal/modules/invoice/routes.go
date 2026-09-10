package invoice

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/config"
	"tagira/internal/middleware"
)

func RegisterRoutes(rg *gin.RouterGroup, handler *InvoiceHandler, cfg *config.Config) {
	invoices := rg.Group("/invoices")
	invoices.Use(middleware.RequireAuth(cfg))
	{
		invoices.POST("", handler.Create)
		invoices.GET("", handler.List)
		invoices.GET("/due-today", middleware.RequireAuth(cfg), handler.GetDueToday)
		invoices.GET("/:id", handler.GetByID)
		invoices.PATCH("/:id/status", handler.UpdateStatus)
		invoices.PATCH("/:id", handler.Update)
	}
}