package summary

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type SummaryRepository interface {
	GetDailySummary(ctx context.Context) (*DailySummary, error)
}

type DailySummary struct {
	Tertagih        int
	BelumTagih      int
	Terlambat       int
	Lunas           int
	BelumBayar      int
	TotalJumlah     int64
	TotalBelum      int64
	TotalTerlambat  int64
}

type summaryRepository struct {
	db *pgxpool.Pool
}

func NewSummaryRepository(db *pgxpool.Pool) SummaryRepository {
	return &summaryRepository{db: db}
}

func (r *summaryRepository) GetDailySummary(ctx context.Context) (*DailySummary, error) {
	// Tertagih: invoice yang sudah ada follow_up_log hari ini
	tertangihQuery := `
		SELECT COUNT(DISTINCT i.id) 
		FROM invoices i 
		WHERE i.status IN ('belum_bayar', 'terlambat') 
		AND EXISTS (
			SELECT 1 FROM follow_up_logs f 
			WHERE f.invoice_id = i.id 
			AND f.tanggal_kirim::date = CURRENT_DATE
		)`

	// Belum tagih: invoice jatuh tempo hari ini atau terlambat tapi belum ada follow_up_log hari ini
	belumTagihQuery := `
		SELECT COUNT(*) 
		FROM invoices i 
		WHERE i.status IN ('belum_bayar', 'terlambat') 
		AND i.jatuh_tempo <= CURRENT_DATE
		AND NOT EXISTS (
			SELECT 1 FROM follow_up_logs f 
			WHERE f.invoice_id = i.id 
			AND f.tanggal_kirim::date = CURRENT_DATE
		)`

	// Terlambat: invoice dengan status terlambat
	terlambatQuery := `SELECT COUNT(*) FROM invoices WHERE status = 'terlambat'`

	// belum bayar = invoice dengan status belum_bayar
	belumBayarQuery := `SELECT COUNT(*) FROM invoices WHERE status = 'belum_bayar'`

	// Lunas: invoice dengan status lunas
	lunasQuery := `SELECT COUNT(*) FROM invoices WHERE status = 'lunas'`

	// Total jumlah semua invoice
	totalJumlahQuery := `SELECT COALESCE(SUM(jumlah), 0) FROM invoices`

	// Total nominal belum bayar
	totalBelumQuery := `SELECT COALESCE(SUM(jumlah), 0) FROM invoices WHERE status IN ('belum_bayar', 'terlambat')`

	// Total nominal terlambat
	totalTerlambatQuery := `SELECT COALESCE(SUM(jumlah), 0) FROM invoices WHERE status = 'terlambat'`

	var summary DailySummary

	err := r.db.QueryRow(ctx, tertangihQuery).Scan(&summary.Tertagih)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(ctx, belumTagihQuery).Scan(&summary.BelumTagih)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(ctx, terlambatQuery).Scan(&summary.Terlambat)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(ctx, lunasQuery).Scan(&summary.Lunas)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(ctx, belumBayarQuery).Scan(&summary.BelumBayar)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(ctx, totalJumlahQuery).Scan(&summary.TotalJumlah)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(ctx, totalBelumQuery).Scan(&summary.TotalBelum)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(ctx, totalTerlambatQuery).Scan(&summary.TotalTerlambat)
	if err != nil {
		return nil, err
	}

	return &summary, nil
}