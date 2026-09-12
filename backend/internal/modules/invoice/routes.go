package invoice

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/config"
	"tagira/internal/middleware"
)

// Group middleware is permissive (session + service token); per-route
// restrictors: writes session-only, due-today token-only (Hermes).
func RegisterRoutes(rg *gin.RouterGroup, handler *InvoiceHandler, cfg *config.Config) {
	invoices := rg.Group("/invoices")
	invoices.Use(middleware.RequireAny(cfg))
	{
		// Create/edit/status open to service token: Hermes mutates invoices on owner's
		// Telegram instruction. Delete intentionally session-only — irreversible.
		invoices.POST("", middleware.RequireAny(cfg), handler.Create)
		invoices.GET("", handler.List)
		invoices.GET("/due-today", middleware.RequireServiceToken(cfg), handler.GetDueToday)
		invoices.GET("/:id", handler.GetByID)
		// Status change open to service token: Hermes marks invoices paid on owner's
		// Telegram instruction (offline payment). Other writes stay session-only.
		invoices.PATCH("/:id/status", middleware.RequireAny(cfg), handler.UpdateStatus)
		invoices.PATCH("/:id", middleware.RequireAny(cfg), handler.Update)
		// Delete open to service token: irreversible, but bot-side ya/batal confirmation guards it.
		invoices.DELETE("/:id", middleware.RequireAny(cfg), handler.Delete)
	}
}
