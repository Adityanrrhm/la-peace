# Tagira — Agent Penagihan & Follow-up Invoice Otomatis untuk UMKM

## Struktur Project

```
la-peace/
├── backend/                 # Go Backend API (Gin + PostgreSQL)
│   ├── cmd/api/main.go      # Entry point
│   ├── internal/            # Private application code
│   │   ├── config/          # Config & validation
│   │   ├── database/        # PostgreSQL + migrations
│   │   ├── middleware/      # Auth, CORS, logging, rate-limit
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Login, JWT session
│   │   │   ├── customer/    # CRUD customer
│   │   │   ├── invoice/     # CRUD invoice + due-today
│   │   │   ├── followup/    # Follow-up logs (manual/hermes)
│   │   │   └── summary/     # Daily summary
│   │   ├── pkg/             # Shared packages
│   │   └── server/          # HTTP server setup
│   ├── migrations/          # SQL migrations
│   ├── docs/                # OpenAPI spec, Hermes guide
│   ├── deploy/              # systemd, deploy script
│   ├── Dockerfile           # Multi-stage production
│   ├── docker-compose.yml   # Production stack
│   ├── docker-compose.dev.yml # Development with hot reload
│   ├── Makefile             # Build, test, deploy commands
│   └── .env.example         # Environment template
└── frontend/                # Next.js Frontend (Dashboard)
```

## Quick Start (Backend)

```bash
cd backend

# Copy env
cp .env.example .env
# Edit .env with your DB credentials

# Run with Docker (recommended)
make docker-up

# Or run locally (requires PostgreSQL)
make run
```

## Quick Start (Frontend)

```bash
cd frontend

# Install dependencies
npm install

# Setup env (optional, defaults to http://localhost:8080/api/v1)
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1" > .env.local

# Run dev server
npm run dev
```

Buka http://localhost:3000, backend harus jalan dulu di port 8080.

## API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/v1/auth/login` | Public |
| GET | `/api/v1/auth/me` | Session |
| GET/POST | `/api/v1/customers` | Session |
| GET/POST | `/api/v1/invoices` | Session |
| GET | `/api/v1/invoices/due-today` | Session + Service-Token |
| POST | `/api/v1/follow-up-logs` | Session + Service-Token |
| GET | `/api/v1/summary/daily` | Session + Service-Token |

## Hermes Integration

- Service Token: `X-Service-Token` header
- Key endpoints: `/invoices/due-today`, `/follow-up-logs`, `/summary/daily`
- See `backend/docs/HERMES_INTEGRATION.md`

## Documentation

- OpenAPI Spec: `backend/docs/openapi.yaml`
- Hermes Guide: `backend/docs/HERMES_INTEGRATION.md`