package summary

type DailySummaryResponse struct {
	Tertagih     int   `json:"tertangih"`     // sudah ditagih (sudah ada follow-up log hari ini)
	BelumTagih   int   `json:"belum_tagih"`   // belum ditagih (jatuh tempo hari ini/terlampat tapi belum ada follow-up)
	Terlambat    int   `json:"terlambat"`     // status terlambat
	Lunas        int   `json:"lunas"`         // status lunas
	TotalJumlah  int64 `json:"total_jumlah"`  // total nominal semua invoice
	TotalBelum   int64 `json:"total_belum"`   // total nominal belum bayar
	TotalTerlambat int64 `json:"total_terlambat"` // total nominal terlambat
}