package pagination

import "math"

type PaginationParams struct {
	Page     int    `form:"page,default=1" binding:"min=1"`
	PageSize int    `form:"page_size,default=20" binding:"min=1,max=100"`
	SortBy   string `form:"sort_by"`
	SortDir  string `form:"sort_dir,default=desc" binding:"omitempty,oneof=asc desc"`
}

func (p *PaginationParams) Offset() int {
	return (p.Page - 1) * p.PageSize
}

func (p *PaginationParams) Limit() int {
	return p.PageSize
}

func (p *PaginationParams) SortOrder() string {
	if p.SortBy == "" {
		return ""
	}
	dir := "ASC"
	if p.SortDir == "desc" {
		dir = "DESC"
	}
	return p.SortBy + " " + dir
}

type Meta struct {
	Page       int   `json:"page,omitempty"`
	PageSize   int   `json:"page_size,omitempty"`
	TotalItems int64 `json:"total_items,omitempty"`
	TotalPages int   `json:"total_pages,omitempty"`
}

func NewMeta(params PaginationParams, totalItems int64) Meta {
	totalPages := int(math.Ceil(float64(totalItems) / float64(params.PageSize)))
	if totalPages < 1 {
		totalPages = 1
	}
	return Meta{
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalItems: totalItems,
		TotalPages: totalPages,
	}
}