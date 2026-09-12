package followup

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/config"
	"tagira/internal/middleware"
)

func RegisterRoutes(rg *gin.RouterGroup, handler *FollowUpLogHandler, cfg *config.Config) {
	followup := rg.Group("/follow-up-logs")
	followup.Use(middleware.RequireAny(cfg))
	{
		followup.POST("", handler.Create)
		followup.GET("", handler.List)
		followup.GET("/invoice/:invoice_id", handler.GetByInvoiceID)
	}
}