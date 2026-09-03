package customer

import (
	"tagira/internal/pkg/pagination"
)

type CreateCustomerRequest struct {
	Nama                 string `json:"nama" binding:"required,min=1,max=255"`
	KontakTelegram       string `json:"kontak_telegram" binding:"omitempty,max=255"`
	CatatanPerilakuBayar string `json:"catatan_perilaku_bayar" binding:"omitempty"`
}

type UpdateCustomerRequest struct {
	Nama                 string `json:"nama" binding:"omitempty,min=1,max=255"`
	KontakTelegram       string `json:"kontak_telegram" binding:"omitempty,max=255"`
	CatatanPerilakuBayar string `json:"catatan_perilaku_bayar" binding:"omitempty"`
}

type CustomerResponse struct {
	ID                   string `json:"id"`
	Nama                 string `json:"nama"`
	KontakTelegram       string `json:"kontak_telegram,omitempty"`
	CatatanPerilakuBayar string `json:"catatan_perilaku_bayar,omitempty"`
	CreatedAt            string `json:"created_at"`
}

type CustomerListResponse struct {
	Customers []CustomerResponse `json:"customers"`
	Meta      pagination.Meta    `json:"meta"`
}

type CustomerFilterParams struct {
	pagination.PaginationParams
	Nama string `form:"nama"`
}