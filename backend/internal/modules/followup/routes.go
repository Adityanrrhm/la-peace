package followup

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/config"
	"tagira/internal/middleware"
)

func RegisterRoutes(rg *gin.RouterGroup, handler *FollowUpLogHandler, cfg *config.Config) {
	followup := rg.Group("/follow-up-logs")
	{
		followup.POST("", middleware.RequireAuthOrServiceToken(cfg), handler.Create)
		followup.GET("", middleware.RequireAuth(cfg), handler.List)
		followup.GET("/invoice/:invoice_id", middleware.RequireAuth(cfg), handler.GetByInvoiceID)
	}
}