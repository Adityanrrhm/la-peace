package followup

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"tagira/internal/pkg/pagination"
)

type FollowUpLog struct {
	ID             string
	InvoiceID      string
	TanggalKirim   time.Time
	IsiPesan       string
	Sumber         string
	ResponCustomer sql.NullString
	CreatedAt      time.Time
}

type FollowUpLogWithInvoice struct {
	FollowUpLog
	CustomerName sql.NullString
}

type FollowUpLogRepository interface {
	Create(ctx context.Context, f *FollowUpLog) error
	List(ctx context.Context, params pagination.PaginationParams, filter FollowUpLogFilterParams) ([]*FollowUpLogWithInvoice, int64, error)
	GetByInvoiceID(ctx context.Context, invoiceID string) ([]*FollowUpLog, error)
}

type followUpLogRepository struct {
	db *pgxpool.Pool
}

func NewFollowUpLogRepository(db *pgxpool.Pool) FollowUpLogRepository {
	return &followUpLogRepository{db: db}
}

func (r *followUpLogRepository) Create(ctx context.Context, f *FollowUpLog) error {
	query := `INSERT INTO follow_up_logs (id, invoice_id, tanggal_kirim, isi_pesan, sumber, respon_customer, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Exec(ctx, query, f.ID, f.InvoiceID, f.TanggalKirim, f.IsiPesan, f.Sumber, f.ResponCustomer, f.CreatedAt)
	return err
}

func (r *followUpLogRepository) List(ctx context.Context, params pagination.PaginationParams, filter FollowUpLogFilterParams) ([]*FollowUpLogWithInvoice, int64, error) {
	whereClause := "WHERE 1=1"
	args := []any{}
	argIndex := 1

	if filter.InvoiceID != "" {
		whereClause += " AND f.invoice_id = $" + fmt.Sprintf("%d", argIndex)
		args = append(args, filter.InvoiceID)
		argIndex++
	}

	if filter.Sumber != "" {
		whereClause += " AND f.sumber = $" + fmt.Sprintf("%d", argIndex)
		args = append(args, filter.Sumber)
		argIndex++
	}

	countQuery := "SELECT COUNT(*) FROM follow_up_logs f " + whereClause
	var total int64
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	sortOrder := params.SortOrder()
	if sortOrder == "" {
		sortOrder = "f.tanggal_kirim DESC"
	}

	listQuery := `SELECT f.id, f.invoice_id, f.tanggal_kirim, f.isi_pesan, f.sumber, f.respon_customer, f.created_at, c.nama
		FROM follow_up_logs f
		LEFT JOIN invoices i ON f.invoice_id = i.id
		LEFT JOIN customers c ON i.customer_id = c.id
		` + whereClause + ` ORDER BY ` + sortOrder + ` LIMIT $` + fmt.Sprintf("%d", argIndex) + ` OFFSET $` + fmt.Sprintf("%d", argIndex+1)
	args = append(args, params.Limit(), params.Offset())

	rows, err := r.db.Query(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []*FollowUpLogWithInvoice
	for rows.Next() {
		var l FollowUpLogWithInvoice
		if err := rows.Scan(&l.ID, &l.InvoiceID, &l.TanggalKirim, &l.IsiPesan, &l.Sumber, &l.ResponCustomer, &l.CreatedAt, &l.CustomerName); err != nil {
			return nil, 0, err
		}
		logs = append(logs, &l)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (r *followUpLogRepository) GetByInvoiceID(ctx context.Context, invoiceID string) ([]*FollowUpLog, error) {
	query := `SELECT id, invoice_id, tanggal_kirim, isi_pesan, sumber, respon_customer, created_at 
		FROM follow_up_logs WHERE invoice_id = $1 ORDER BY tanggal_kirim DESC`
	rows, err := r.db.Query(ctx, query, invoiceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*FollowUpLog
	for rows.Next() {
		var l FollowUpLog
		if err := rows.Scan(&l.ID, &l.InvoiceID, &l.TanggalKirim, &l.IsiPesan, &l.Sumber, &l.ResponCustomer, &l.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, &l)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return logs, nil
}