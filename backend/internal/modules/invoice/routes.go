package invoice

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/config"
	"tagira/internal/middleware"
)

func RegisterRoutes(rg *gin.RouterGroup, handler *InvoiceHandler, cfg *config.Config) {
	invoices := rg.Group("/invoices")
	{
<<<<<<< HEAD
		invoices.POST("", handler.Create)
		invoices.GET("", handler.List)
		invoices.GET("/due-today", middleware.RequireAuth(cfg), handler.GetDueToday)
		invoices.GET("/:id", handler.GetByID)
		invoices.PATCH("/:id/status", handler.UpdateStatus)
		invoices.PATCH("/:id", handler.Update)
=======
		invoices.POST("", middleware.RequireAuth(cfg), handler.Create)
		invoices.GET("", middleware.RequireAuth(cfg), handler.List)
		invoices.GET("/due-today", middleware.RequireAuthOrServiceToken(cfg), handler.GetDueToday)
		invoices.GET("/:id", middleware.RequireAuth(cfg), handler.GetByID)
		invoices.PATCH("/:id/status", middleware.RequireAuth(cfg), handler.UpdateStatus)
>>>>>>> b26fb2d9e1ae2e15d187c9b9310cd23d3320eb3b
	}
}