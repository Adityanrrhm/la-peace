package invoice

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"tagira/internal/pkg/pagination"
)

type Invoice struct {
	ID            string
	CustomerID    string
	Jumlah        int64
	TanggalTerbit time.Time
	JatuhTempo    time.Time
	Status        string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type InvoiceWithCustomer struct {
	Invoice
	CustomerName     sql.NullString
	KontakTelegram   sql.NullString
}

type InvoiceRepository interface {
	Create(ctx context.Context, i *Invoice) error
	GetByID(ctx context.Context, id string) (*Invoice, error)
	List(ctx context.Context, params pagination.PaginationParams, filter InvoiceFilterParams) ([]*InvoiceWithCustomer, int64, error)
	UpdateStatus(ctx context.Context, id, status string) error
	Update(ctx context.Context, i *Invoice) error
	Delete(ctx context.Context, id string) error
	GetDueToday(ctx context.Context) ([]*InvoiceWithCustomer, error)
}

type invoiceRepository struct {
	db *pgxpool.Pool
}

func NewInvoiceRepository(db *pgxpool.Pool) InvoiceRepository {
	return &invoiceRepository{db: db}
}

func (r *invoiceRepository) Create(ctx context.Context, i *Invoice) error {
	query := `INSERT INTO invoices (id, customer_id, jumlah, tanggal_terbit, jatuh_tempo, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err := r.db.Exec(ctx, query, i.ID, i.CustomerID, i.Jumlah, i.TanggalTerbit, i.JatuhTempo, i.Status, i.CreatedAt, i.UpdatedAt)
	return err
}

func (r *invoiceRepository) GetByID(ctx context.Context, id string) (*Invoice, error) {
	query := `SELECT id, customer_id, jumlah, tanggal_terbit, jatuh_tempo, status, created_at, updated_at FROM invoices WHERE id = $1`
	row := r.db.QueryRow(ctx, query, id)

	var i Invoice
	err := row.Scan(&i.ID, &i.CustomerID, &i.Jumlah, &i.TanggalTerbit, &i.JatuhTempo, &i.Status, &i.CreatedAt, &i.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *invoiceRepository) List(ctx context.Context, params pagination.PaginationParams, filter InvoiceFilterParams) ([]*InvoiceWithCustomer, int64, error) {
	whereClause := "WHERE 1=1"
	args := []any{}
	argIndex := 1

	if filter.Status != "" {
		whereClause += " AND i.status = $" + fmt.Sprintf("%d", argIndex)
		args = append(args, filter.Status)
		argIndex++
	}

	if filter.CustomerID != "" {
		whereClause += " AND i.customer_id = $" + fmt.Sprintf("%d", argIndex)
		args = append(args, filter.CustomerID)
		argIndex++
	}

	countQuery := "SELECT COUNT(*) FROM invoices i " + whereClause
	var total int64
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	sortOrder := params.SortOrder()
	if sortOrder == "" {
		sortOrder = "i.created_at DESC"
	}

	listQuery := `SELECT i.id, i.customer_id, i.jumlah, i.tanggal_terbit, i.jatuh_tempo, i.status, i.created_at, i.updated_at, c.nama
		FROM invoices i
		LEFT JOIN customers c ON i.customer_id = c.id
		` + whereClause + ` ORDER BY ` + sortOrder + ` LIMIT $` + fmt.Sprintf("%d", argIndex) + ` OFFSET $` + fmt.Sprintf("%d", argIndex+1)
	args = append(args, params.Limit(), params.Offset())

	rows, err := r.db.Query(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var invoices []*InvoiceWithCustomer
	for rows.Next() {
		var i InvoiceWithCustomer
		if err := rows.Scan(&i.ID, &i.CustomerID, &i.Jumlah, &i.TanggalTerbit, &i.JatuhTempo, &i.Status, &i.CreatedAt, &i.UpdatedAt, &i.CustomerName); err != nil {
			return nil, 0, err
		}
		invoices = append(invoices, &i)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return invoices, total, nil
}

func (r *invoiceRepository) UpdateStatus(ctx context.Context, id, status string) error {
	query := `UPDATE invoices SET status = $2, updated_at = NOW() WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id, status)
	return err
}

func (r *invoiceRepository) Update(ctx context.Context, i *Invoice) error {
	query := `UPDATE invoices SET customer_id = $2, jumlah = $3, jatuh_tempo = $4, updated_at = $5 WHERE id = $1`
	_, err := r.db.Exec(ctx, query, i.ID, i.CustomerID, i.Jumlah, i.JatuhTempo, i.UpdatedAt)
	return err
}

func (r *invoiceRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM invoices WHERE id = $1`, id)
	return err
}

func (r *invoiceRepository) GetDueToday(ctx context.Context) ([]*InvoiceWithCustomer, error) {
	query := `SELECT i.id, i.customer_id, i.jumlah, i.tanggal_terbit, i.jatuh_tempo, i.status, i.created_at, i.updated_at, c.nama, c.kontak_telegram
		FROM invoices i
		LEFT JOIN customers c ON i.customer_id = c.id
		WHERE i.jatuh_tempo <= CURRENT_DATE AND i.status IN ('belum_bayar', 'terlambat')
		ORDER BY i.jatuh_tempo ASC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invoices []*InvoiceWithCustomer
	for rows.Next() {
		var i InvoiceWithCustomer
		if err := rows.Scan(&i.ID, &i.CustomerID, &i.Jumlah, &i.TanggalTerbit, &i.JatuhTempo, &i.Status, &i.CreatedAt, &i.UpdatedAt, &i.CustomerName, &i.KontakTelegram); err != nil {
			return nil, err
		}
		invoices = append(invoices, &i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return invoices, nil
}