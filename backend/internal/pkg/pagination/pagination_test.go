package pagination

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestPaginationParams_Offset(t *testing.T) {
	params := PaginationParams{Page: 1, PageSize: 20}
	assert.Equal(t, 0, params.Offset())

	params = PaginationParams{Page: 2, PageSize: 20}
	assert.Equal(t, 20, params.Offset())

	params = PaginationParams{Page: 3, PageSize: 10}
	assert.Equal(t, 20, params.Offset())
}

func TestPaginationParams_Limit(t *testing.T) {
	params := PaginationParams{PageSize: 20}
	assert.Equal(t, 20, params.Limit())

	params = PaginationParams{PageSize: 50}
	assert.Equal(t, 50, params.Limit())
}

func TestPaginationParams_SortOrder(t *testing.T) {
	params := PaginationParams{SortBy: "created_at", SortDir: "desc"}
	assert.Equal(t, "created_at DESC", params.SortOrder())

	params = PaginationParams{SortBy: "nama", SortDir: "asc"}
	assert.Equal(t, "nama ASC", params.SortOrder())

	params = PaginationParams{SortBy: "nama", SortDir: "desc"}
	assert.Equal(t, "nama DESC", params.SortOrder())

	params = PaginationParams{}
	assert.Equal(t, "", params.SortOrder())
}

func TestNewMeta(t *testing.T) {
	params := PaginationParams{Page: 1, PageSize: 20}
	meta := NewMeta(params, 45)
	assert.Equal(t, 1, meta.Page)
	assert.Equal(t, 20, meta.PageSize)
	assert.Equal(t, int64(45), meta.TotalItems)
	assert.Equal(t, 3, meta.TotalPages)

	params = PaginationParams{Page: 2, PageSize: 10}
	meta = NewMeta(params, 0)
	assert.Equal(t, 2, meta.Page)
	assert.Equal(t, 10, meta.PageSize)
	assert.Equal(t, int64(0), meta.TotalItems)
	assert.Equal(t, 1, meta.TotalPages)
}