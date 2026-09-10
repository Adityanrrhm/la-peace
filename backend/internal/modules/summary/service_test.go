package summary

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockSummaryRepository struct {
	mock.Mock
}

func (m *MockSummaryRepository) GetDailySummary(ctx context.Context) (*DailySummary, error) {
	args := m.Called(ctx)
	return args.Get(0).(*DailySummary), args.Error(1)
}

func TestSummaryService_GetDailySummary(t *testing.T) {
	mockRepo := new(MockSummaryRepository)
	svc := NewSummaryService(mockRepo)

	expectedSummary := &DailySummary{
		Tertagih:        5,
		BelumTagih:      3,
		Terlambat:       2,
		BelumBayar:      7,
		Lunas:           10,
		TotalJumlah:     10000000,
		TotalBelum:      5000000,
		TotalTerlambat:  2000000,
	}

	mockRepo.On("GetDailySummary", mock.Anything).Return(expectedSummary, nil)

	resp, err := svc.GetDailySummary(context.Background())
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, expectedSummary.Tertagih, resp.Tertagih)
	assert.Equal(t, expectedSummary.BelumTagih, resp.BelumTagih)
	assert.Equal(t, expectedSummary.Terlambat, resp.Terlambat)
	assert.Equal(t, expectedSummary.BelumBayar, resp.BelumBayar)
	assert.Equal(t, expectedSummary.Lunas, resp.Lunas)
	assert.Equal(t, expectedSummary.TotalJumlah, resp.TotalJumlah)
	assert.Equal(t, expectedSummary.TotalBelum, resp.TotalBelum)
	assert.Equal(t, expectedSummary.TotalTerlambat, resp.TotalTerlambat)
	mockRepo.AssertExpectations(t)
}