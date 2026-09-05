package invoice

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"tagira/internal/pkg/pagination"
)

type InvoiceService struct {
	repo InvoiceRepository
}

func NewInvoiceService(repo InvoiceRepository) *InvoiceService {
	return &InvoiceService{repo: repo}
}

func (s *InvoiceService) Create(ctx context.Context, req CreateInvoiceRequest) (*InvoiceResponse, error) {
	now := time.Now()
	tTanggalTerbit, _ := time.Parse("2006-01-02", req.TanggalTerbit)
	tJatuhTempo, _ := time.Parse("2006-01-02", req.JatuhTempo)
	i := &Invoice{
		ID:            uuid.New().String(),
		CustomerID:    req.CustomerID,
		Jumlah:        req.Jumlah,
		TanggalTerbit: tTanggalTerbit,
		JatuhTempo:    tJatuhTempo,
		Status:        "belum_bayar",
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.repo.Create(ctx, i); err != nil {
		return nil, err
	}

	return s.toResponse(i, ""), nil
}

func (s *InvoiceService) GetByID(ctx context.Context, id string) (*InvoiceResponse, error) {
	i, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if i == nil {
		return nil, errors.New("invoice not found")
	}
	return s.toResponse(i, ""), nil
}

func (s *InvoiceService) List(ctx context.Context, params pagination.PaginationParams, filter InvoiceFilterParams) (*InvoiceListResponse, error) {
	invoices, total, err := s.repo.List(ctx, params, filter)
	if err != nil {
		return nil, err
	}

	responses := make([]InvoiceResponse, len(invoices))
	for i, inv := range invoices {
		responses[i] = *s.toResponse(&inv.Invoice, inv.CustomerName.String)
	}

	return &InvoiceListResponse{
		Invoices: responses,
		Meta:     pagination.NewMeta(params, total),
	}, nil
}

func (s *InvoiceService) UpdateStatus(ctx context.Context, id, status string) (*InvoiceResponse, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("invoice not found")
	}

	if err := s.repo.UpdateStatus(ctx, id, status); err != nil {
		return nil, err
	}

	existing.Status = status
	existing.UpdatedAt = time.Now()
	return s.toResponse(existing, ""), nil
}

func (s *InvoiceService) GetDueToday(ctx context.Context) ([]InvoiceResponse, error) {
	invoices, err := s.repo.GetDueToday(ctx)
	if err != nil {
		return nil, err
	}

	responses := make([]InvoiceResponse, len(invoices))
	for i, inv := range invoices {
		responses[i] = *s.toResponse(&inv.Invoice, inv.CustomerName.String)
	}
	return responses, nil
}

func (s *InvoiceService) toResponse(i *Invoice, customerName string) *InvoiceResponse {
	return &InvoiceResponse{
		ID:           i.ID,
		CustomerID:   i.CustomerID,
		CustomerName: customerName,
		Jumlah:       i.Jumlah,
		TanggalTerbit: i.TanggalTerbit.Format("2006-01-02"),
		JatuhTempo:   i.JatuhTempo.Format("2006-01-02"),
		Status:       i.Status,
		CreatedAt:    i.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    i.UpdatedAt.Format(time.RFC3339),
	}
}