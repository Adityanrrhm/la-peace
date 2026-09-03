package invoice

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"tagira/internal/pkg/pagination"
)

type MockInvoiceRepository struct {
	mock.Mock
}

func (m *MockInvoiceRepository) Create(ctx context.Context, i *Invoice) error {
	args := m.Called(ctx, i)
	return args.Error(0)
}

func (m *MockInvoiceRepository) GetByID(ctx context.Context, id string) (*Invoice, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*Invoice), args.Error(1)
}

func (m *MockInvoiceRepository) List(ctx context.Context, params pagination.PaginationParams, filter InvoiceFilterParams) ([]*InvoiceWithCustomer, int64, error) {
	args := m.Called(ctx, params, filter)
	return args.Get(0).([]*InvoiceWithCustomer), args.Get(1).(int64), args.Error(2)
}

func (m *MockInvoiceRepository) UpdateStatus(ctx context.Context, id, status string) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *MockInvoiceRepository) GetDueToday(ctx context.Context) ([]*InvoiceWithCustomer, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*InvoiceWithCustomer), args.Error(1)
}

func TestInvoiceService_Create(t *testing.T) {
	mockRepo := new(MockInvoiceRepository)
	svc := NewInvoiceService(mockRepo)

	req := CreateInvoiceRequest{
		CustomerID:    uuid.New().String(),
		Jumlah:        100000,
		TanggalTerbit: "2024-01-01",
		JatuhTempo:    "2024-01-15",
	}

	mockRepo.On("Create", mock.Anything, mock.MatchedBy(func(i *Invoice) bool {
		return i.CustomerID == req.CustomerID && i.Jumlah == req.Jumlah
	})).Return(nil)

	resp, err := svc.Create(context.Background(), req)
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, req.CustomerID, resp.CustomerID)
	assert.Equal(t, req.Jumlah, resp.Jumlah)
	assert.Equal(t, "belum_bayar", resp.Status)
	assert.NotEmpty(t, resp.ID)
	mockRepo.AssertExpectations(t)
}

func TestInvoiceService_GetByID(t *testing.T) {
	mockRepo := new(MockInvoiceRepository)
	svc := NewInvoiceService(mockRepo)

	id := uuid.New().String()
	expected := &Invoice{
		ID:            id,
		CustomerID:    uuid.New().String(),
		Jumlah:        100000,
		TanggalTerbit: "2024-01-01",
		JatuhTempo:    "2024-01-15",
		Status:        "belum_bayar",
		CreatedAt:     "2024-01-01T00:00:00Z",
		UpdatedAt:     "2024-01-01T00:00:00Z",
	}

	mockRepo.On("GetByID", mock.Anything, id).Return(expected, nil)

	resp, err := svc.GetByID(context.Background(), id)
	assert.NoError(t, err)
	assert.Equal(t, expected.Jumlah, resp.Jumlah)
	mockRepo.AssertExpectations(t)
}

func TestInvoiceService_GetByID_NotFound(t *testing.T) {
	mockRepo := new(MockInvoiceRepository)
	svc := NewInvoiceService(mockRepo)

	mockRepo.On("GetByID", mock.Anything, "non-existent").Return((*Invoice)(nil), nil)

	resp, err := svc.GetByID(context.Background(), "non-existent")
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "not found")
	mockRepo.AssertExpectations(t)
}

func TestInvoiceService_List(t *testing.T) {
	mockRepo := new(MockInvoiceRepository)
	svc := NewInvoiceService(mockRepo)

	params := pagination.PaginationParams{Page: 1, PageSize: 10}
	filter := InvoiceFilterParams{PaginationParams: params}

	customerID := uuid.New().String()
	expectedInvoices := []*InvoiceWithCustomer{
		{Invoice: Invoice{ID: uuid.New().String(), CustomerID: customerID, Jumlah: 100000}},
		{Invoice: Invoice{ID: uuid.New().String(), CustomerID: customerID, Jumlah: 200000}},
	}

	mockRepo.On("List", mock.Anything, params, filter).Return(expectedInvoices, int64(2), nil)

	resp, err := svc.List(context.Background(), params, filter)
	assert.NoError(t, err)
	assert.Len(t, resp.Invoices, 2)
	assert.Equal(t, int64(2), resp.Meta.TotalItems)
	mockRepo.AssertExpectations(t)
}

func TestInvoiceService_UpdateStatus(t *testing.T) {
	mockRepo := new(MockInvoiceRepository)
	svc := NewInvoiceService(mockRepo)

	id := uuid.New().String()
	existing := &Invoice{ID: id, Status: "belum_bayar"}

	mockRepo.On("GetByID", mock.Anything, id).Return(existing, nil)
	mockRepo.On("UpdateStatus", mock.Anything, id, "lunas").Return(nil)

	resp, err := svc.UpdateStatus(context.Background(), id, "lunas")
	assert.NoError(t, err)
	assert.Equal(t, "lunas", resp.Status)
	mockRepo.AssertExpectations(t)
}

func TestInvoiceService_GetDueToday(t *testing.T) {
	mockRepo := new(MockInvoiceRepository)
	svc := NewInvoiceService(mockRepo)

	customerID := uuid.New().String()
	expectedInvoices := []*InvoiceWithCustomer{
		{Invoice: Invoice{ID: uuid.New().String(), CustomerID: customerID, Jumlah: 100000, Status: "belum_bayar"}},
		{Invoice: Invoice{ID: uuid.New().String(), CustomerID: customerID, Jumlah: 200000, Status: "terlambat"}},
	}

	mockRepo.On("GetDueToday", mock.Anything).Return(expectedInvoices, nil)

	resp, err := svc.GetDueToday(context.Background())
	assert.NoError(t, err)
	assert.Len(t, resp, 2)
	assert.Equal(t, "belum_bayar", resp[0].Status)
	assert.Equal(t, "terlambat", resp[1].Status)
	mockRepo.AssertExpectations(t)
}