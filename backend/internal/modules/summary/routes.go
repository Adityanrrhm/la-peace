package summary

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/config"
	"tagira/internal/middleware"
)

func RegisterRoutes(rg *gin.RouterGroup, handler *SummaryHandler, cfg *config.Config) {
	summary := rg.Group("/summary")
	{
		summary.GET("/daily", middleware.RequireAuthOrServiceToken(cfg), handler.GetDaily)
	}
}