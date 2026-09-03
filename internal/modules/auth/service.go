package auth

import (
	"context"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"github.com/google/uuid"

	"tagira/internal/config"
	"tagira/internal/middleware"
)

type AuthService struct {
	repo UserRepository
	cfg  *config.Config
}

func NewAuthService(repo UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{repo: repo, cfg: cfg}
}

func (s *AuthService) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, err := middleware.GenerateToken(user.ID, user.Email, s.cfg)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		User: UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
		},
		Token: token,
	}, nil
}

func (s *AuthService) CreateUser(ctx context.Context, email, password string) (*User, error) {
	existing, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("user already exists")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &User{
		ID:           uuid.New().String(),
		Email:        email,
		PasswordHash: string(hash),
		CreatedAt:    time.Now().Format(time.RFC3339),
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}