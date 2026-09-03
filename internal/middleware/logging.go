package middleware

import (
	"io"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

func NewLogger(logFormat, logLevel string) zerolog.Logger {
	var w io.Writer = os.Stdout
	if logFormat == "console" {
		w = zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}
	}

	level, _ := zerolog.ParseLevel(logLevel)
	return zerolog.New(w).Level(level).With().Timestamp().Logger()
}

func LoggingMiddleware(logger zerolog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Set("request_id", requestID)
		c.Writer.Header().Set("X-Request-ID", requestID)

		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()
		bodySize := c.Writer.Size()

		if raw != "" {
			path = path + "?" + raw
		}

		logger.Info().
			Str("request_id", requestID).
			Str("method", method).
			Str("path", path).
			Str("client_ip", clientIP).
			Int("status", statusCode).
			Int("body_size", bodySize).
			Dur("latency", latency).
			Msg("HTTP request")
	}
}