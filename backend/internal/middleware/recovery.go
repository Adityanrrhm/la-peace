package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

func RecoveryMiddleware(logger zerolog.Logger) gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		requestID, _ := c.Get("request_id")
		logger.Error().
			Interface("request_id", requestID).
			Interface("panic", recovered).
			Msg("Panic recovered")

		c.JSON(500, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Internal server error",
			},
		})
		c.Abort()
	})
}