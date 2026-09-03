package followup

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"

	"tagira/internal/pkg/pagination"
)

type FollowUpLogService struct {
	repo FollowUpLogRepository
}

func NewFollowUpLogService(repo FollowUpLogRepository) *FollowUpLogService {
	return &FollowUpLogService{repo: repo}
}

func (s *FollowUpLogService) Create(ctx context.Context, req CreateFollowUpLogRequest) (*FollowUpLogResponse, error) {
	now := time.Now().Format(time.RFC3339)
	f := &FollowUpLog{
		ID:             uuid.New().String(),
		InvoiceID:      req.InvoiceID,
		TanggalKirim:   now,
		IsiPesan:       req.IsiPesan,
		Sumber:         req.Sumber,
		ResponCustomer: nullString(req.ResponCustomer),
		CreatedAt:      now,
	}

	if err := s.repo.Create(ctx, f); err != nil {
		return nil, err
	}

	return s.toResponse(f, ""), nil
}

func (s *FollowUpLogService) List(ctx context.Context, params pagination.PaginationParams, filter FollowUpLogFilterParams) (*FollowUpLogListResponse, error) {
	logs, total, err := s.repo.List(ctx, params, filter)
	if err != nil {
		return nil, err
	}

	responses := make([]FollowUpLogResponse, len(logs))
	for i, l := range logs {
		responses[i] = *s.toResponse(&l.FollowUpLog, l.CustomerName.String)
	}

	return &FollowUpLogListResponse{
		Logs: responses,
		Meta: pagination.NewMeta(params, total),
	}, nil
}

func (s *FollowUpLogService) GetByInvoiceID(ctx context.Context, invoiceID string) ([]FollowUpLogResponse, error) {
	logs, err := s.repo.GetByInvoiceID(ctx, invoiceID)
	if err != nil {
		return nil, err
	}

	responses := make([]FollowUpLogResponse, len(logs))
	for i, l := range logs {
		responses[i] = *s.toResponse(l, "")
	}
	return responses, nil
}

func (s *FollowUpLogService) toResponse(f *FollowUpLog, customerName string) *FollowUpLogResponse {
	return &FollowUpLogResponse{
		ID:              f.ID,
		InvoiceID:       f.InvoiceID,
		InvoiceCustomer: customerName,
		TanggalKirim:    f.TanggalKirim,
		IsiPesan:        f.IsiPesan,
		Sumber:          f.Sumber,
		ResponCustomer:  f.ResponCustomer.String,
		CreatedAt:       f.CreatedAt,
	}
}

func nullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}