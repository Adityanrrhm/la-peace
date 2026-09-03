package customer

import (
	"context"
	"database/sql"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"tagira/internal/pkg/pagination"
)

type MockCustomerRepository struct {
	mock.Mock
}

func (m *MockCustomerRepository) Create(ctx context.Context, c *Customer) error {
	args := m.Called(ctx, c)
	return args.Error(0)
}

func (m *MockCustomerRepository) GetByID(ctx context.Context, id string) (*Customer, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*Customer), args.Error(1)
}

func (m *MockCustomerRepository) List(ctx context.Context, params pagination.PaginationParams, filter CustomerFilterParams) ([]*Customer, int64, error) {
	args := m.Called(ctx, params, filter)
	return args.Get(0).([]*Customer), args.Get(1).(int64), args.Error(2)
}

func (m *MockCustomerRepository) Update(ctx context.Context, c *Customer) error {
	args := m.Called(ctx, c)
	return args.Error(0)
}

func (m *MockCustomerRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestCustomerService_Create(t *testing.T) {
	mockRepo := new(MockCustomerRepository)
	svc := NewCustomerService(mockRepo)

	req := CreateCustomerRequest{
		Nama:                 "Test Customer",
		KontakTelegram:       "@test",
		CatatanPerilakuBayar: "Pembayar baik",
	}

	mockRepo.On("Create", mock.Anything, mock.MatchedBy(func(c *Customer) bool {
		return c.Nama == req.Nama && c.KontakTelegram.String == req.KontakTelegram
	})).Return(nil)

	resp, err := svc.Create(context.Background(), req)
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, req.Nama, resp.Nama)
	assert.Equal(t, req.KontakTelegram, resp.KontakTelegram)
	assert.NotEmpty(t, resp.ID)
	mockRepo.AssertExpectations(t)
}

func TestCustomerService_GetByID(t *testing.T) {
	mockRepo := new(MockCustomerRepository)
	svc := NewCustomerService(mockRepo)

	id := uuid.New().String()
	expected := &Customer{
		ID:                   id,
		Nama:                 "Test",
		KontakTelegram:       sqlNullString("@test"),
		CatatanPerilakuBayar: sqlNullString("Good payer"),
		CreatedAt:            "2024-01-01T00:00:00Z",
	}

	mockRepo.On("GetByID", mock.Anything, id).Return(expected, nil)

	resp, err := svc.GetByID(context.Background(), id)
	assert.NoError(t, err)
	assert.Equal(t, expected.Nama, resp.Nama)
	mockRepo.AssertExpectations(t)
}

func TestCustomerService_GetByID_NotFound(t *testing.T) {
	mockRepo := new(MockCustomerRepository)
	svc := NewCustomerService(mockRepo)

	mockRepo.On("GetByID", mock.Anything, "non-existent").Return((*Customer)(nil), nil)

	resp, err := svc.GetByID(context.Background(), "non-existent")
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "not found")
	mockRepo.AssertExpectations(t)
}

func TestCustomerService_List(t *testing.T) {
	mockRepo := new(MockCustomerRepository)
	svc := NewCustomerService(mockRepo)

	params := pagination.PaginationParams{Page: 1, PageSize: 10}
	filter := CustomerFilterParams{PaginationParams: params}

	expectedCustomers := []*Customer{
		{ID: uuid.New().String(), Nama: "Customer 1"},
		{ID: uuid.New().String(), Nama: "Customer 2"},
	}

	mockRepo.On("List", mock.Anything, params, filter).Return(expectedCustomers, int64(2), nil)

	resp, err := svc.List(context.Background(), params, filter)
	assert.NoError(t, err)
	assert.Len(t, resp.Customers, 2)
	assert.Equal(t, int64(2), resp.Meta.TotalItems)
	assert.Equal(t, 1, resp.Meta.TotalPages)
	mockRepo.AssertExpectations(t)
}

func TestCustomerService_Update(t *testing.T) {
	mockRepo := new(MockCustomerRepository)
	svc := NewCustomerService(mockRepo)

	id := uuid.New().String()
	existing := &Customer{ID: id, Nama: "Old Name"}

	mockRepo.On("GetByID", mock.Anything, id).Return(existing, nil)
	mockRepo.On("Update", mock.Anything, mock.MatchedBy(func(c *Customer) bool {
		return c.Nama == "New Name"
	})).Return(nil)

	req := UpdateCustomerRequest{Nama: "New Name"}
	resp, err := svc.Update(context.Background(), id, req)
	assert.NoError(t, err)
	assert.Equal(t, "New Name", resp.Nama)
	mockRepo.AssertExpectations(t)
}

func TestCustomerService_Delete(t *testing.T) {
	mockRepo := new(MockCustomerRepository)
	svc := NewCustomerService(mockRepo)

	id := uuid.New().String()
	existing := &Customer{ID: id}

	mockRepo.On("GetByID", mock.Anything, id).Return(existing, nil)
	mockRepo.On("Delete", mock.Anything, id).Return(nil)

	err := svc.Delete(context.Background(), id)
	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func sqlNullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}