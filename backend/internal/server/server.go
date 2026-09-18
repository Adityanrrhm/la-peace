package server

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"

	"tagira/internal/config"
	"tagira/internal/database"
	"tagira/internal/middleware"
	"tagira/internal/modules/auth"
	"tagira/internal/modules/customer"
	"tagira/internal/modules/followup"
	"tagira/internal/modules/invoice"
	"tagira/internal/modules/summary"
)

type Server struct {
	httpServer *http.Server
	engine     *gin.Engine
	logger     zerolog.Logger
	cfg        *config.Config
	pool       *database.Pool
}

func New(cfg *config.Config, pool *database.Pool) *Server {
	logger := middleware.NewLogger(cfg.LogFormat, cfg.LogLevel)

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	engine := gin.New()

	engine.Use(middleware.RecoveryMiddleware(logger))
	engine.Use(middleware.LoggingMiddleware(logger))
	engine.Use(middleware.CORSMiddleware(cfg))
	engine.Use(middleware.RateLimitMiddleware(
		middleware.NewRateLimiter(cfg.RateLimitRequests, cfg.RateLimitWindowSeconds),
		logger,
	))

	s := &Server{
		engine: engine,
		logger: logger,
		cfg:    cfg,
		pool:   pool,
	}

	s.registerRoutes()
	return s
}

func (s *Server) registerRoutes() {
	api := s.engine.Group("/api/v1")

	// Health check
	s.engine.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Auth module
	authRepo := auth.NewUserRepository(s.pool)
	authSvc := auth.NewAuthService(authRepo, s.cfg)
	authHandler := auth.NewAuthHandler(authSvc, s.cfg)
	auth.RegisterRoutes(api, authHandler, s.cfg)

	// Customer module
	customerRepo := customer.NewCustomerRepository(s.pool)
	customerSvc := customer.NewCustomerService(customerRepo)
	customerHandler := customer.NewCustomerHandler(customerSvc)
	customer.RegisterRoutes(api, customerHandler, s.cfg)

	// Invoice module
	invoiceRepo := invoice.NewInvoiceRepository(s.pool)
	invoiceSvc := invoice.NewInvoiceService(invoiceRepo)
	invoiceHandler := invoice.NewInvoiceHandler(invoiceSvc)
	invoice.RegisterRoutes(api, invoiceHandler, s.cfg)

	// Follow-up Log module
	followupRepo := followup.NewFollowUpLogRepository(s.pool)
	followupSvc := followup.NewFollowUpLogService(followupRepo)
	followupHandler := followup.NewFollowUpLogHandler(followupSvc)
	followup.RegisterRoutes(api, followupHandler, s.cfg)

	// Summary module
	summaryRepo := summary.NewSummaryRepository(s.pool)
	summarySvc := summary.NewSummaryService(summaryRepo)
	summaryHandler := summary.NewSummaryHandler(summarySvc)
	summary.RegisterRoutes(api, summaryHandler, s.cfg)

	// Serve frontend static files (production)
	if s.cfg.FrontendDir != "" {
		s.serveStatic(s.cfg.FrontendDir)
	}
}

func (s *Server) Engine() *gin.Engine {
	return s.engine
}

func (s *Server) serveStatic(dir string) {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		s.logger.Warn().Str("dir", dir).Msg("Frontend dir not found, skipping static serving")
		return
	}

	s.engine.NoRoute(func(c *gin.Context) {
		// API requests get 404
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.JSON(404, gin.H{"error": "not found"})
			return
		}

		// Try exact file first
		path := filepath.Join(dir, c.Request.URL.Path)
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			c.File(path)
			return
		}

		// SPA fallback — serve index.html for client-side routing
		c.File(filepath.Join(dir, "index.html"))
	})

	s.logger.Info().Str("dir", dir).Msg("Serving frontend static files")
}

func (s *Server) Run(addr string) error {
	s.logger.Info().Str("addr", addr).Msg("Starting server")
	s.httpServer = &http.Server{
		Addr:    addr,
		Handler: s.engine,
	}
	if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}
	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	if s.httpServer == nil {
		return nil
	}
	s.logger.Info().Msg("Gracefully shutting down HTTP server...")
	return s.httpServer.Shutdown(ctx)
}