package summary

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/config"
	"tagira/internal/middleware"
)

func RegisterRoutes(rg *gin.RouterGroup, handler *SummaryHandler, cfg *config.Config) {
	summary := rg.Group("/summary")
	summary.Use(middleware.RequireAny(cfg))
	{
		summary.GET("/daily", handler.GetDaily)
	}
}