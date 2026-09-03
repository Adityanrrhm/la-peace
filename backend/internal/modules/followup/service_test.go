package followup

import (
	"context"
	"database/sql"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"tagira/internal/pkg/pagination"
)

type MockFollowUpLogRepository struct {
	mock.Mock
}

func (m *MockFollowUpLogRepository) Create(ctx context.Context, f *FollowUpLog) error {
	args := m.Called(ctx, f)
	return args.Error(0)
}

func (m *MockFollowUpLogRepository) List(ctx context.Context, params pagination.PaginationParams, filter FollowUpLogFilterParams) ([]*FollowUpLogWithInvoice, int64, error) {
	args := m.Called(ctx, params, filter)
	return args.Get(0).([]*FollowUpLogWithInvoice), args.Get(1).(int64), args.Error(2)
}

func (m *MockFollowUpLogRepository) GetByInvoiceID(ctx context.Context, invoiceID string) ([]*FollowUpLog, error) {
	args := m.Called(ctx, invoiceID)
	return args.Get(0).([]*FollowUpLog), args.Error(1)
}

func TestFollowUpLogService_Create(t *testing.T) {
	mockRepo := new(MockFollowUpLogRepository)
	svc := NewFollowUpLogService(mockRepo)

	req := CreateFollowUpLogRequest{
		InvoiceID:      uuid.New().String(),
		IsiPesan:       "Test reminder",
		Sumber:         "manual",
		ResponCustomer: "OK",
	}

	mockRepo.On("Create", mock.Anything, mock.MatchedBy(func(f *FollowUpLog) bool {
		return f.InvoiceID == req.InvoiceID && f.IsiPesan == req.IsiPesan && f.Sumber == req.Sumber
	})).Return(nil)

	resp, err := svc.Create(context.Background(), req)
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, req.InvoiceID, resp.InvoiceID)
	assert.Equal(t, req.IsiPesan, resp.IsiPesan)
	assert.Equal(t, req.Sumber, resp.Sumber)
	assert.NotEmpty(t, resp.ID)
	mockRepo.AssertExpectations(t)
}

func TestFollowUpLogService_List(t *testing.T) {
	mockRepo := new(MockFollowUpLogRepository)
	svc := NewFollowUpLogService(mockRepo)

	params := pagination.PaginationParams{Page: 1, PageSize: 10}
	filter := FollowUpLogFilterParams{PaginationParams: params}

	invoiceID := uuid.New().String()
	expectedLogs := []*FollowUpLogWithInvoice{
		{FollowUpLog: FollowUpLog{ID: uuid.New().String(), InvoiceID: invoiceID, IsiPesan: "Test 1"}},
		{FollowUpLog: FollowUpLog{ID: uuid.New().String(), InvoiceID: invoiceID, IsiPesan: "Test 2"}},
	}

	mockRepo.On("List", mock.Anything, params, filter).Return(expectedLogs, int64(2), nil)

	resp, err := svc.List(context.Background(), params, filter)
	assert.NoError(t, err)
	assert.Len(t, resp.Logs, 2)
	assert.Equal(t, int64(2), resp.Meta.TotalItems)
	mockRepo.AssertExpectations(t)
}

func TestFollowUpLogService_GetByInvoiceID(t *testing.T) {
	mockRepo := new(MockFollowUpLogRepository)
	svc := NewFollowUpLogService(mockRepo)

	invoiceID := uuid.New().String()
	expectedLogs := []*FollowUpLog{
		{ID: uuid.New().String(), InvoiceID: invoiceID, IsiPesan: "Test 1"},
		{ID: uuid.New().String(), InvoiceID: invoiceID, IsiPesan: "Test 2"},
	}

	mockRepo.On("GetByInvoiceID", mock.Anything, invoiceID).Return(expectedLogs, nil)

	resp, err := svc.GetByInvoiceID(context.Background(), invoiceID)
	assert.NoError(t, err)
	assert.Len(t, resp, 2)
	assert.Equal(t, "Test 1", resp[0].IsiPesan)
	mockRepo.AssertExpectations(t)
}

func sqlNullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}