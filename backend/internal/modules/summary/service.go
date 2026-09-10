package summary

import (
	"context"
)

type SummaryService struct {
	repo SummaryRepository
}

func NewSummaryService(repo SummaryRepository) *SummaryService {
	return &SummaryService{repo: repo}
}

func (s *SummaryService) GetDailySummary(ctx context.Context) (*DailySummaryResponse, error) {
	summary, err := s.repo.GetDailySummary(ctx)
	if err != nil {
		return nil, err
	}

	return &DailySummaryResponse{
		Tertagih:        summary.Tertagih,
		BelumTagih:      summary.BelumTagih,
		Terlambat:       summary.Terlambat,
		BelumBayar:      summary.BelumBayar,
		Lunas:           summary.Lunas,
		TotalJumlah:     summary.TotalJumlah,
		TotalBelum:      summary.TotalBelum,
		TotalTerlambat:  summary.TotalTerlambat,
	}, nil
}