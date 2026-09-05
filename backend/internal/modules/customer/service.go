package customer

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"

	"tagira/internal/pkg/pagination"
)

type CustomerService struct {
	repo CustomerRepository
}

func NewCustomerService(repo CustomerRepository) *CustomerService {
	return &CustomerService{repo: repo}
}

func (s *CustomerService) Create(ctx context.Context, req CreateCustomerRequest) (*CustomerResponse, error) {
	now := time.Now()
	c := &Customer{
		ID:                   uuid.New().String(),
		Nama:                 req.Nama,
		KontakTelegram:       nullString(req.KontakTelegram),
		CatatanPerilakuBayar: nullString(req.CatatanPerilakuBayar),
		CreatedAt:            now,
	}

	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}

	return s.toResponse(c), nil
}

func (s *CustomerService) GetByID(ctx context.Context, id string) (*CustomerResponse, error) {
	c, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if c == nil {
		return nil, errors.New("customer not found")
	}
	return s.toResponse(c), nil
}

func (s *CustomerService) List(ctx context.Context, params pagination.PaginationParams, filter CustomerFilterParams) (*CustomerListResponse, error) {
	customers, total, err := s.repo.List(ctx, params, filter)
	if err != nil {
		return nil, err
	}

	responses := make([]CustomerResponse, len(customers))
	for i, c := range customers {
		responses[i] = *s.toResponse(c)
	}

	return &CustomerListResponse{
		Customers: responses,
		Meta:      pagination.NewMeta(params, total),
	}, nil
}

func (s *CustomerService) Update(ctx context.Context, id string, req UpdateCustomerRequest) (*CustomerResponse, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("customer not found")
	}

	if req.Nama != "" {
		existing.Nama = req.Nama
	}
	if req.KontakTelegram != "" {
		existing.KontakTelegram = nullString(req.KontakTelegram)
	}
	if req.CatatanPerilakuBayar != "" {
		existing.CatatanPerilakuBayar = nullString(req.CatatanPerilakuBayar)
	}

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}

	return s.toResponse(existing), nil
}

func (s *CustomerService) Delete(ctx context.Context, id string) error {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("customer not found")
	}
	return s.repo.Delete(ctx, id)
}

func (s *CustomerService) toResponse(c *Customer) *CustomerResponse {
	return &CustomerResponse{
		ID:                   c.ID,
		Nama:                 c.Nama,
		KontakTelegram:       c.KontakTelegram.String,
		CatatanPerilakuBayar: c.CatatanPerilakuBayar.String,
		CreatedAt:            c.CreatedAt.Format(time.RFC3339),
	}
}

func nullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}