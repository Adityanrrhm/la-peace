package customer

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"tagira/internal/pkg/errors"
	"tagira/internal/pkg/response"
)

type CustomerHandler struct {
	svc *CustomerService
}

func NewCustomerHandler(svc *CustomerService) *CustomerHandler {
	return &CustomerHandler{svc: svc}
}

func (h *CustomerHandler) Create(c *gin.Context) {
	var req CreateCustomerRequest
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

func (h *CustomerHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	resp, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, errors.NewInternal(err.Error()))
		return
	}
	if resp == nil {
		response.Error(c, errors.NewNotFound("Customer"))
		return
	}

	response.Success(c, resp, nil)
}

func (h *CustomerHandler) List(c *gin.Context) {
	var params CustomerFilterParams
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

func (h *CustomerHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req UpdateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.NewValidationError(err.Error()))
		return
	}

	resp, err := h.svc.Update(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "customer not found" {
			response.Error(c, errors.NewNotFound("Customer"))
			return
		}
		response.Error(c, errors.NewInternal(err.Error()))
		return
	}

	response.Success(c, resp, nil)
}

func (h *CustomerHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	err := h.svc.Delete(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "customer not found" {
			response.Error(c, errors.NewNotFound("Customer"))
			return
		}
		response.Error(c, errors.NewInternal(err.Error()))
		return
	}

	c.Status(http.StatusNoContent)
}