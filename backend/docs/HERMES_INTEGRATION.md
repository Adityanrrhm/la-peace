# Hermes Integration Guide

## Overview
This guide explains how to integrate Hermes Agent with Tagira API for automated invoice follow-up.

## Authentication

### Service Token (Recommended for Hermes)
Include the `X-Service-Token` header in all requests:

```bash
curl -H "X-Service-Token: YOUR_SERVICE_TOKEN" \
     http://localhost:8080/api/v1/invoices/due-today
```

Configure in `.env`:
```env
SERVICE_TOKEN=hermes_secure_random_token_here
```

## Key Endpoints for Hermes

### 1. Get Due Invoices (Daily Cron)
```http
GET /api/v1/invoices/due-today
```
Returns invoices that are due today or overdue with status `belum_bayar` or `terlambat`.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "customer_name": "Customer Name",
      "jumlah": 100000,
      "tanggal_terbit": "2024-01-01",
      "jatuh_tempo": "2024-01-15",
      "status": "belum_bayar",
      "created_at": "2024-01-01T00:00:00+07:00",
      "updated_at": "2024-01-01T00:00:00+07:00"
    }
  ],
  "error": null,
  "meta": null
}
```

### 2. Create Follow-up Log (After Sending Reminder)
```http
POST /api/v1/follow-up-logs
Content-Type: application/json

{
  "invoice_id": "uuid",
  "isi_pesan": "Halo Bapak/Ibu, ini pengingat tagihan...",
  "sumber": "hermes",
  "respon_customer": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "invoice_id": "uuid",
    "invoice_customer": "Customer Name",
    "tanggal_kirim": "2024-01-15T10:30:00+07:00",
    "isi_pesan": "Halo Bapak/Ibu...",
    "sumber": "hermes",
    "respon_customer": "",
    "created_at": "2024-01-15T10:30:00+07:00"
  },
  "error": null,
  "meta": null
}
```

### 3. Get Daily Summary (For Owner Report)
```http
GET /api/v1/summary/daily
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tertangih": 5,
    "belum_tagih": 3,
    "terlambat": 2,
    "lunas": 10,
    "total_jumlah": 10000000,
    "total_belum": 5000000,
    "total_terlambat": 2000000
  },
  "error": null,
  "meta": null
}
```

## Suggested Hermes Workflow

### Daily Cron (e.g., 09:00 WIB)
```python
# Pseudocode for Hermes daily task
def daily_followup():
    # 1. Get due invoices
    due_invoices = api.get("/invoices/due-today")
    
    for invoice in due_invoices.data:
        # 2. Generate personalized message
        message = generate_message(invoice)
        
        # 3. Send via Telegram/WhatsApp
        send_message(invoice.customer_id, message)
        
        # 4. Log follow-up
        api.post("/follow-up-logs", {
            "invoice_id": invoice.id,
            "isi_pesan": message,
            "sumber": "hermes"
        })
    
    # 5. Get summary for owner
    summary = api.get("/summary/daily")
    
    # 6. Send summary to owner
    send_owner_report(summary.data)
```

## Error Handling

All endpoints return consistent error format:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR|NOT_FOUND|UNAUTHORIZED|FORBIDDEN|CONFLICT|INTERNAL_ERROR|RATE_LIMIT_EXCEEDED",
    "message": "Human readable message",
    "details": {}
  },
  "meta": null
}
```

**Common Hermes-relevant errors:**
- `UNAUTHORIZED` - Invalid or missing service token
- `RATE_LIMIT_EXCEEDED` - Too many requests (default 100/min)
- `NOT_FOUND` - Invoice not found when logging follow-up

## Rate Limits
- Default: 100 requests per minute per IP/user
- Service token requests counted separately
- Configure via env: `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`

## Timezone
- All timestamps in response are **WIB (UTC+7)** RFC3339 format
- Database stores UTC
- Example: `2024-01-15T10:30:00+07:00`

## Testing Integration

### Test Service Token
```bash
curl -H "X-Service-Token: your_token" \
     http://localhost:8080/api/v1/invoices/due-today
```

### Test Follow-up Creation
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: your_token" \
  -d '{"invoice_id":"uuid","isi_pesan":"Test","sumber":"hermes"}' \
  http://localhost:8080/api/v1/follow-up-logs
```

### Test Summary
```bash
curl -H "X-Service-Token: your_token" \
     http://localhost:8080/api/v1/summary/daily
```

## Environment Variables for Hermes

| Variable | Description | Required |
|----------|-------------|----------|
| `SERVICE_TOKEN` | Shared secret for Hermes authentication | Yes |
| `HERMES_WEBHOOK_URL` | Optional callback URL for async events | No |
| `HERMES_ENABLED` | Feature flag to enable Hermes endpoints | No |

## Security Checklist
- [ ] Use strong `SERVICE_TOKEN` (32+ random chars)
- [ ] Rotate tokens periodically
- [ ] Use HTTPS in production
- [ ] Restrict CORS to known origins
- [ ] Monitor rate limit logs
- [ ] Audit follow-up logs regularly

## Support
For integration issues, check:
1. API logs: `journalctl -u tagira-api -f`
2. Response format matches OpenAPI spec (`docs/openapi.yaml`)
3. Service token matches in both `.env` and Hermes config