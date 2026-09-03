package followup

import (
	"tagira/internal/pkg/pagination"
)

type CreateFollowUpLogRequest struct {
	InvoiceID      string `json:"invoice_id" binding:"required,uuid"`
	IsiPesan       string `json:"isi_pesan" binding:"required,min=1"`
	Sumber         string `json:"sumber" binding:"required,oneof=manual hermes"`
	ResponCustomer string `json:"respon_customer" binding:"omitempty"`
}

type FollowUpLogResponse struct {
	ID              string `json:"id"`
	InvoiceID       string `json:"invoice_id"`
	InvoiceCustomer string `json:"invoice_customer,omitempty"`
	TanggalKirim    string `json:"tanggal_kirim"`
	IsiPesan        string `json:"isi_pesan"`
	Sumber          string `json:"sumber"`
	ResponCustomer  string `json:"respon_customer,omitempty"`
	CreatedAt       string `json:"created_at"`
}

type FollowUpLogListResponse struct {
	Logs []FollowUpLogResponse `json:"logs"`
	Meta pagination.Meta       `json:"meta"`
}

type FollowUpLogFilterParams struct {
	pagination.PaginationParams
	InvoiceID string `form:"invoice_id" binding:"omitempty,uuid"`
	Sumber    string `form:"sumber" binding:"omitempty,oneof=manual hermes"`
}