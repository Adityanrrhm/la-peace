package middleware

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

type RateLimiter struct {
	requests int
	window   time.Duration
	mu       sync.Mutex
	clients  map[string]*clientState
}

type clientState struct {
	count     int
	resetTime time.Time
}

func NewRateLimiter(requests int, windowSeconds int) *RateLimiter {
	rl := &RateLimiter{
		requests: requests,
		window:   time.Duration(windowSeconds) * time.Second,
		clients:  make(map[string]*clientState),
	}
	go rl.cleanup()
	return rl
}

func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.window)
	defer ticker.Stop()
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for k, v := range rl.clients {
			if now.After(v.resetTime) {
				delete(rl.clients, k)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	state, exists := rl.clients[key]
	if !exists || now.After(state.resetTime) {
		rl.clients[key] = &clientState{
			count:     1,
			resetTime: now.Add(rl.window),
		}
		return true
	}

	if state.count >= rl.requests {
		return false
	}

	state.count++
	return true
}

func RateLimitMiddleware(rl *RateLimiter, logger zerolog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.ClientIP()
		if userID, exists := c.Get("user_id"); exists {
			key = userID.(string)
		}

		if !rl.Allow(key) {
			logger.Warn().
				Str("key", key).
				Str("path", c.Request.URL.Path).
				Msg("Rate limit exceeded")

			c.JSON(429, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "RATE_LIMIT_EXCEEDED",
					"message": "Too many requests",
				},
			})
			c.Abort()
			return
		}

		c.Next()
	}
}