package followup

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/pkg/errors"
	"tagira/internal/pkg/response"
)

type FollowUpLogHandler struct {
	svc *FollowUpLogService
}

func NewFollowUpLogHandler(svc *FollowUpLogService) *FollowUpLogHandler {
	return &FollowUpLogHandler{svc: svc}
}

func (h *FollowUpLogHandler) Create(c *gin.Context) {
	var req CreateFollowUpLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.NewValidationError(err.Error()))
		return
	}

	resp, err := h.svc.Create(c.Request.Context(), req)
	if err != nil {
		response.Error(c, errors.NewInternal(err.Error()))
		return
	}

	response.Created(c, resp)
}

func (h *FollowUpLogHandler) List(c *gin.Context) {
	var params FollowUpLogFilterParams
	if err := c.ShouldBindQuery(&params); err != nil {
		response.Error(c, errors.NewValidationError(err.Error()))
		return
	}

	resp, err := h.svc.List(c.Request.Context(), params.PaginationParams, params)
	if err != nil {
		response.Error(c, errors.NewInternal(err.Error()))
		return
	}

	response.Success(c, resp, nil)
}

func (h *FollowUpLogHandler) GetByInvoiceID(c *gin.Context) {
	invoiceID := c.Param("invoice_id")
	resp, err := h.svc.GetByInvoiceID(c.Request.Context(), invoiceID)
	if err != nil {
		response.Error(c, errors.NewInternal(err.Error()))
		return
	}

	response.Success(c, resp, nil)
}