package server

import (
	"context"
	"net/http"

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
}

func (s *Server) Engine() *gin.Engine {
	return s.engine
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