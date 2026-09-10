package invoice

import (
	"tagira/internal/pkg/pagination"
)

type CreateInvoiceRequest struct {
	CustomerID string `json:"customer_id" binding:"required,uuid"`
	Jumlah     int64  `json:"jumlah" binding:"required,min=1"`
	TanggalTerbit string `json:"tanggal_terbit" binding:"required"` // YYYY-MM-DD
	JatuhTempo string `json:"jatuh_tempo" binding:"required"` // YYYY-MM-DD
}

type UpdateInvoiceRequest struct {
	CustomerID *string `json:"customer_id" binding:"omitempty,uuid"`
	Jumlah     *int64  `json:"jumlah" binding:"omitempty,min=1"`
	JatuhTempo *string `json:"jatuh_tempo" binding:"omitempty"` // YYYY-MM-DD
}

type UpdateInvoiceStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=belum_bayar lunas terlambat"`
}

type InvoiceResponse struct {
	ID             string `json:"id"`
	CustomerID     string `json:"customer_id"`
	CustomerName   string `json:"customer_name,omitempty"`
	Jumlah         int64  `json:"jumlah"`
	TanggalTerbit  string `json:"tanggal_terbit"`
	JatuhTempo     string `json:"jatuh_tempo"`
	Status         string `json:"status"`
	CreatedAt      string `json:"created_at"`
	UpdatedAt      string `json:"updated_at"`
}

type InvoiceListResponse struct {
	Invoices []InvoiceResponse `json:"invoices"`
	Meta     pagination.Meta   `json:"meta"`
}

type InvoiceFilterParams struct {
	pagination.PaginationParams
	Status     string `form:"status" binding:"omitempty,oneof=belum_bayar lunas terlambat"`
	CustomerID string `form:"customer_id" binding:"omitempty,uuid"`
}