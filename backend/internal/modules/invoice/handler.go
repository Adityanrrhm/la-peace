package invoice

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/pkg/errors"
	"tagira/internal/pkg/response"
)

type InvoiceHandler struct {
	svc *InvoiceService
}

func NewInvoiceHandler(svc *InvoiceService) *InvoiceHandler {
	return &InvoiceHandler{svc: svc}
}

func (h *InvoiceHandler) Create(c *gin.Context) {
	var req CreateInvoiceRequest
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

func (h *InvoiceHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	resp, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, errors.NewInternal(err.Error()))
		return
	}
	if resp == nil {
		response.Error(c, errors.NewNotFound("Invoice"))
		return
	}

	response.Success(c, resp, nil)
}

func (h *InvoiceHandler) List(c *gin.Context) {
	var params InvoiceFilterParams
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

func (h *InvoiceHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req UpdateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.NewValidationError(err.Error()))
		return
	}

	resp, err := h.svc.Update(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "invoice not found" {
			response.Error(c, errors.NewNotFound("Invoice"))
			return
		}
		response.Error(c, errors.NewInternal(err.Error()))
		return
	}

	response.Success(c, resp, nil)
}

func (h *InvoiceHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	var req UpdateInvoiceStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.NewValidationError(err.Error()))
		return
	}

	resp, err := h.svc.UpdateStatus(c.Request.Context(), id, req.Status)
	if err != nil {
		if err.Error() == "invoice not found" {
			response.Error(c, errors.NewNotFound("Invoice"))
			return
		}
		response.Error(c, errors.NewInternal(err.Error()))
		return
	}

	response.Success(c, resp, nil)
}

func (h *InvoiceHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	err := h.svc.Delete(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "invoice not found" {
			response.Error(c, errors.NewNotFound("Invoice"))
			return
		}
		response.Error(c, errors.NewInternal(err.Error()))
		return
	}
	response.Success(c, gin.H{"deleted": id}, nil)
}

func (h *InvoiceHandler) GetDueToday(c *gin.Context) {
	resp, err := h.svc.GetDueToday(c.Request.Context())
	if err != nil {
		response.Error(c, errors.NewInternal(err.Error()))
		return
	}

	response.Success(c, resp, nil)
}