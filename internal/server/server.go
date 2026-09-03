package server

import (
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"

	"tagira/internal/config"
	"tagira/internal/database"
	"tagira/internal/middleware"
	"tagira/internal/modules/auth"
	"tagira/internal/modules/customer"
	"tagira/internal/modules/invoice"
)

type Server struct {
	engine *gin.Engine
	logger zerolog.Logger
	cfg    *config.Config
	pool   *database.Pool
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
}

func (s *Server) Engine() *gin.Engine {
	return s.engine
}

func (s *Server) Run(addr string) error {
	s.logger.Info().Str("addr", addr).Msg("Starting server")
	return s.engine.Run(addr)
}