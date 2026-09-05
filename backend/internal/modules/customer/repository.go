package customer

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"tagira/internal/pkg/pagination"
)

type Customer struct {
	ID                   string
	Nama                 string
	KontakTelegram       sql.NullString
	CatatanPerilakuBayar sql.NullString
	CreatedAt            string
}

type CustomerRepository interface {
	Create(ctx context.Context, c *Customer) error
	GetByID(ctx context.Context, id string) (*Customer, error)
	List(ctx context.Context, params pagination.PaginationParams, filter CustomerFilterParams) ([]*Customer, int64, error)
	Update(ctx context.Context, c *Customer) error
	Delete(ctx context.Context, id string) error
}

type customerRepository struct {
	db *pgxpool.Pool
}

func NewCustomerRepository(db *pgxpool.Pool) CustomerRepository {
	return &customerRepository{db: db}
}

func (r *customerRepository) Create(ctx context.Context, c *Customer) error {
	query := `INSERT INTO customers (id, nama, kontak_telegram, catatan_perilaku_bayar, created_at) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, c.ID, c.Nama, c.KontakTelegram, c.CatatanPerilakuBayar, c.CreatedAt)
	return err
}

func (r *customerRepository) GetByID(ctx context.Context, id string) (*Customer, error) {
	query := `SELECT id, nama, kontak_telegram, catatan_perilaku_bayar, created_at FROM customers WHERE id = $1`
	row := r.db.QueryRow(ctx, query, id)

	var c Customer
	err := row.Scan(&c.ID, &c.Nama, &c.KontakTelegram, &c.CatatanPerilakuBayar, &c.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *customerRepository) List(ctx context.Context, params pagination.PaginationParams, filter CustomerFilterParams) ([]*Customer, int64, error) {
	whereClause := "WHERE 1=1"
	args := []any{}
	argIndex := 1

	if filter.Nama != "" {
		whereClause += " AND nama ILIKE $" + fmt.Sprintf("%d", argIndex)
		args = append(args, "%"+filter.Nama+"%")
		argIndex++
	}

	// Count total
	countQuery := "SELECT COUNT(*) FROM customers " + whereClause
	var total int64
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Build list query
	sortOrder := params.SortOrder()
	if sortOrder == "" {
		sortOrder = "created_at DESC"
	}

	listQuery := `SELECT id, nama, kontak_telegram, catatan_perilaku_bayar, created_at 
		FROM customers ` + whereClause + ` ORDER BY ` + sortOrder + ` LIMIT $` + fmt.Sprintf("%d", argIndex) + ` OFFSET $` + fmt.Sprintf("%d", argIndex+1)
	args = append(args, params.Limit(), params.Offset())

	rows, err := r.db.Query(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var customers []*Customer
	for rows.Next() {
		var c Customer
		if err := rows.Scan(&c.ID, &c.Nama, &c.KontakTelegram, &c.CatatanPerilakuBayar, &c.CreatedAt); err != nil {
			return nil, 0, err
		}
		customers = append(customers, &c)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return customers, total, nil
}

func (r *customerRepository) Update(ctx context.Context, c *Customer) error {
	query := `UPDATE customers SET nama = $2, kontak_telegram = $3, catatan_perilaku_bayar = $4 WHERE id = $1`
	_, err := r.db.Exec(ctx, query, c.ID, c.Nama, c.KontakTelegram, c.CatatanPerilakuBayar)
	return err
}

func (r *customerRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM customers WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}