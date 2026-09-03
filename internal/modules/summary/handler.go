package summary

import (
	"github.com/gin-gonic/gin"

	"tagira/internal/pkg/errors"
	"tagira/internal/pkg/response"
)

type SummaryHandler struct {
	svc *SummaryService
}

func NewSummaryHandler(svc *SummaryService) *SummaryHandler {
	return &SummaryHandler{svc: svc}
}

func (h *SummaryHandler) GetDaily(c *gin.Context) {
	resp, err := h.svc.GetDailySummary(c.Request.Context())
	if err != nil {
		response.Error(c, errors.NewInternal(err.Error()))
		return
	}

	response.Success(c, resp, nil)
}