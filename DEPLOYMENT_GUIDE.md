# Tagira — Deployment & Development Guide

Panduan lengkap untuk menjalankan **Backend (Go)** dan **Frontend (Next.js)** secara lokal maupun production di VPS.

---

## 📁 Struktur Project

```
la-peace/
├── backend/                 # Go Backend API
│   ├── cmd/api/main.go      # Entry point
│   ├── internal/            # Private packages
│   ├── migrations/          # SQL migrations
│   ├── docs/                # OpenAPI spec & Hermes guide
│   ├── deploy/              # systemd service & deploy script
│   ├── Dockerfile           # Multi-stage production
│   ├── docker-compose.yml   # Production stack
│   ├── docker-compose.dev.yml # Development dengan hot reload
│   ├── Makefile             # Commands: run, test, build, deploy
│   ├── .env.example         # Template environment
│   └── go.mod / go.sum
├── frontend/                # Next.js Dashboard
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/ui/   # Reusable UI components
│   │   ├── hooks/           # React Query hooks
│   │   ├── lib/             # API client & utilities
│   │   ├── context/         # Auth & Toast context
│   │   └── types/           # TypeScript types
│   ├── next.config.ts       # Static export config
│   ├── tailwind.config.ts   # Design tokens
│   ├── package.json
│   └── .env.local
├── agents/                  # Agent specs (optional)
└── README.md                # Overview
```

---

## 🔧 Prasyarat

| Tool | Versi Minimum | Install |
|------|---------------|---------|
| Go | 1.22+ | `winget install GoLang.Go` / `brew install go` |
| Node.js | 20+ | `winget install OpenJS.NodeJS` / `brew install node` |
| PostgreSQL | 15+ | `winget install PostgreSQL.PostgreSQL` / `brew install postgresql@15` |
| Docker | 24+ | Docker Desktop |
| Make | 4.3+ | `winget install GnuWin32.Make` / `brew install make` |
| Air (hot reload) | - | `go install github.com/air-verse/air@latest` |

---

## 🚀 Quick Start (Development)

### 1. Clone & Setup Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env dengan konfigurasi lokal
# Minimal: DB_PASSWORD, SESSION_SECRET, JWT_SECRET, SERVICE_TOKEN
```

**Contoh `.env` development:**
```env
APP_ENV=development
APP_PORT=8080
APP_HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_USER=tagira
DB_PASSWORD=tagira_dev
DB_NAME=tagira
DB_SSL_MODE=disable

SESSION_SECRET=dev_session_secret_32_chars_minimum
JWT_SECRET=dev_jwt_secret_32_chars_minimum____
JWT_EXPIRE_HOURS=24
SERVICE_TOKEN=dev_hermes_service_token_change_me

CORS_ALLOWED_ORIGINS=http://localhost:3000
LOG_FORMAT=console
LOG_LEVEL=debug
```

### 2. Start PostgreSQL (via Docker)

```bash
# Dari root project
docker compose -f backend/docker-compose.dev.yml up -d postgres
```

Atau install PostgreSQL native dan buat database/user:
```sql
CREATE USER tagira WITH PASSWORD 'tagira_dev';
CREATE DATABASE tagira OWNER tagira;
GRANT ALL PRIVILEGES ON DATABASE tagira TO tagira;
```

### 3. Run Backend

```bash
cd backend

# Install dependencies
go mod tidy

# Run migrations & start server
make run
# Atau manual:
go run cmd/api/main.go -migrate
go run cmd/api/main.go
```

**Verify:** `curl http://localhost:8080/health` → `{"status":"ok"}`

### 4. Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env
cp .env.local.example .env.local 2>/dev/null || echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1" > .env.local

# Run dev server
npm run dev
```

**Akses:** http://localhost:3000 (redirect ke `/login`)

---

## 🔐 Default Login (Development)

Backend tidak punya user default. Buat user pertama via API:

```bash
# Register user via API (butuh password bcrypt)
# Atau insert manual ke database:
INSERT INTO users (id, email, password_hash, created_at)
VALUES (
  gen_random_uuid(),
  'admin@tagira.local',
  '$2a$10$dummyhashfordevonly',  -- gunakan bcrypt generator
  NOW()
);
```

Atau gunakan script seed (buat file `backend/cmd/seed/main.go`).

---

## 📦 Production Deployment (VPS)

### 1. Persiapan VPS

**Spesifikasi minimum:** 4 vCPU / 4GB RAM / 20GB SSD

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y postgresql-15 nginx certbot python3-certbot-nginx

# Install Go
wget https://go.dev/dl/go1.22.3.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.3.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.profile
source ~/.profile
```

### 2. Setup PostgreSQL

```bash
sudo -u postgres psql <<EOF
CREATE USER tagira WITH PASSWORD 'STRONG_PASSWORD_HERE';
CREATE DATABASE tagira OWNER tagira;
GRANT ALL PRIVILEGES ON DATABASE tagira TO tagira;
EOF

# Optimize PostgreSQL untuk 4GB RAM
sudo tee /etc/postgresql/15/main/conf.d/tagira.conf <<EOF
shared_buffers = 512MB
effective_cache_size = 1536MB
max_connections = 100
work_mem = 4MB
maintenance_work_mem = 128MB
EOF

sudo systemctl restart postgresql
```

### 3. Deploy Backend

```bash
# Clone repo
git clone https://github.com/Adityanrrhm/la-peace.git
cd la-peace/backend

# Build binary
make build
# Output: bin/tagira-api

# Deploy via script (butuh sudo)
sudo ./deploy/deploy.sh production
```

**Script deploy akan:**
- Buat user `tagira` & direktori `/opt/tagira`
- Copy binary & migrations
- Generate `.env` template di `/opt/tagira/.env`
- Install systemd service
- Run migrations
- Start service

### 4. Configure Production `.env`

```bash
sudo tee /opt/tagira/.env <<EOF
APP_ENV=production
APP_PORT=8080
APP_HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_USER=tagira
DB_PASSWORD=STRONG_PASSWORD_HERE
DB_NAME=tagira
DB_SSL_MODE=disable

SESSION_SECRET=GENERATE_32_CHARS_RANDOM_STRING
JWT_SECRET=GENERATE_32_CHARS_RANDOM_STRING_FOR_JWT
JWT_EXPIRE_HOURS=24
SERVICE_TOKEN=GENERATE_HERMES_SERVICE_TOKEN

CORS_ALLOWED_ORIGINS=https://yourdomain.com
LOG_FORMAT=json
LOG_LEVEL=info
EOF
```

**Generate secrets:**
```bash
# Session & JWT secret (32+ chars)
openssl rand -base64 32

# Service token
openssl rand -hex 32
```

### 5. Setup Nginx Reverse Proxy

```bash
sudo tee /etc/nginx/sites-available/tagira <<EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (static files)
    location / {
        root /opt/tagira/frontend;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/v1/ {
        proxy_pass http://localhost:8080/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8080/health;
        access_log off;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/tagira /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 6. SSL dengan Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Pilih redirect HTTP ke HTTPS
```

### 7. Deploy Frontend (Static Export)

```bash
cd frontend

# Build production
npm run build
# Output: out/ directory

# Copy ke server
sudo mkdir -p /opt/tagira/frontend
sudo cp -r out/* /opt/tagira/frontend/
sudo chown -R tagira:tagira /opt/tagira/frontend
```

---

## 🐳 Docker Deployment (Alternative)

### Development

```bash
# Backend + Postgres + Frontend hot reload
docker compose -f backend/docker-compose.dev.yml up -d

# Frontend dev server di localhost:3000
# Backend API di localhost:8080
```

### Production

```bash
# Build images
docker compose -f backend/docker-compose.yml build

# Start services
docker compose -f backend/docker-compose.yml up -d

# Check logs
docker compose -f backend/docker-compose.yml logs -f
```

---

## 🔧 Makefile Commands (Backend)

| Command | Deskripsi |
|---------|-----------|
| `make run` | Jalankan server development |
| `make migrate-up` | Jalankan migrasi database |
| `make migrate-down` | Rollback 1 migrasi |
| `make test` | Jalankan unit tests (`-race`) |
| `make build` | Build binary production (`bin/tagira-api`) |
| `make lint` | Jalankan golangci-lint |
| `make tidy` | `go mod tidy` |
| `make dev` | Hot reload dengan Air |
| `make docker-build` | Build Docker image |
| `make docker-up` | Start Docker compose |
| `make docker-down` | Stop Docker compose |
| `make deploy` | Deploy ke VPS (butuh sudo) |

---

## 📚 API Documentation

| Resource | URL |
|----------|-----|
| OpenAPI Spec | `backend/docs/openapi.yaml` |
| Hermes Integration Guide | `backend/docs/HERMES_INTEGRATION.md` |

**Import OpenAPI ke Postman/Insomnia:**
1. Import → File → `backend/docs/openapi.yaml`
2. Set environment variable `base_url` = `http://localhost:8080/api/v1` (dev) atau `https://yourdomain.com/api/v1` (prod)

---

## 🔑 Environment Variables Reference

### Backend (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_ENV` | ✓ | `development` | `development` / `production` |
| `APP_PORT` | ✓ | `8080` | Port server |
| `APP_HOST` | ✓ | `0.0.0.0` | Bind address |
| `DB_HOST` | ✓ | `localhost` | PostgreSQL host |
| `DB_PORT` | ✓ | `5432` | PostgreSQL port |
| `DB_USER` | ✓ | `tagira` | DB user |
| `DB_PASSWORD` | ✓ | - | DB password |
| `DB_NAME` | ✓ | `tagira` | Database name |
| `DB_SSL_MODE` | ✓ | `disable` | `disable` / `require` / `verify-full` |
| `SESSION_SECRET` | ✓ | - | Min 32 chars, untuk JWT signing |
| `JWT_SECRET` | ✓ | - | Min 32 chars, untuk JWT signing |
| `JWT_EXPIRE_HOURS` | | `24` | Token expiry |
| `SERVICE_TOKEN` | ✓ | - | Token untuk Hermes (server-to-server) |
| `CORS_ALLOWED_ORIGINS` | ✓ | `http://localhost:3000` | Comma-separated origins |
| `LOG_FORMAT` | | `console` | `json` / `console` |
| `LOG_LEVEL` | | `info` | `debug` / `info` / `warn` / `error` |

### Frontend (`.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✓ | `http://localhost:8080/api/v1` | Backend API base URL |

---

## 🧪 Testing

### Backend Unit Tests

```bash
cd backend
make test
# atau
go test -v -race -count=1 ./...
```

### Frontend (Manual)

```bash
cd frontend
npm run dev
# Test di browser: login, CRUD invoice/customer, follow-up, summary
```

### Integration Test (Backend)

```bash
cd backend
go test -v -race -count=1 -tags=integration ./...
# Butuh PostgreSQL running
```

---

## 🔍 Monitoring & Logs

### Systemd Service (Backend)

```bash
# Status
sudo systemctl status tagira-api

# Logs
sudo journalctl -u tagira-api -f

# Restart
sudo systemctl restart tagira-api
```

### Nginx Logs

```bash
# Access
sudo tail -f /var/log/nginx/access.log

# Error
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL Logs

```bash
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Resource Monitoring

```bash
# Memory/CPU
htop
free -h

# Disk
df -h

# Network connections
ss -tulnp | grep -E '(8080|5432|80|443)'
```

---

## 🛠 Troubleshooting

### Backend: "Failed to connect to database"

```bash
# Cek PostgreSQL running
sudo systemctl status postgresql

# Cek koneksi
psql -h localhost -U tagira -d tagira -c "SELECT 1;"

# Cek .env values
cat /opt/tagira/.env
```

### Backend: "Configuration validation failed"

```bash
# Validasi config
/opt/tagira/tagira-api -validate

# Common issues:
# - SESSION_SECRET < 32 chars
# - JWT_SECRET < 32 chars  
# - SERVICE_TOKEN missing
# - DB_PASSWORD weak (contains "password", "123456", etc)
```

### Frontend: "Network Error" / CORS

```bash
# Cek CORS_ALLOWED_ORIGINS di backend .env
# Harus include frontend domain: https://yourdomain.com

# Cek NEXT_PUBLIC_API_URL di frontend .env.local
# Harus match backend URL + /api/v1
```

### Nginx: 502 Bad Gateway

```bash
# Cek backend running
curl http://localhost:8080/health

# Cek nginx config
sudo nginx -t

# Cek port 8080 listening
ss -tulnp | grep 8080
```

### SSL: Certbot Error

```bash
# Pastikan DNS A record sudah pointing ke VPS IP
# Pastikan port 80 & 443 terbuka di firewall

# Test manual
sudo certbot certonly --standalone -d yourdomain.com
```

---

## 🔄 Backup & Restore

### Database Backup

```bash
# Backup
pg_dump -h localhost -U tagira tagira > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed
pg_dump -h localhost -U tagira tagira | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Database Restore

```bash
# Restore
gunzip -c backup_20240115.sql.gz | psql -h localhost -U tagira tagira

# Or plain SQL
psql -h localhost -U tagira tagira < backup_20240115.sql
```

### Automated Backup (Cron)

```bash
sudo tee /etc/cron.daily/tagira-backup <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/tagira/backups"
mkdir -p $BACKUP_DIR
pg_dump -h localhost -U tagira tagira | gzip > $BACKUP_DIR/tagira_$(date +%Y%m%d).sql.gz
# Keep 7 days
find $BACKUP_DIR -name "tagira_*.sql.gz" -mtime +7 -delete
EOF

sudo chmod +x /etc/cron.daily/tagira-backup
```

---

## 📈 Performance Tuning (4GB RAM VPS)

| Service | Memory Target | Config |
|---------|---------------|--------|
| PostgreSQL | ~800MB | `shared_buffers=512MB`, `max_connections=100` |
| Backend Go | ~100MB | `DB_MAX_OPEN_CONNS=10`, `GOMEMLIMIT=200MiB` |
| Nginx | ~50MB | `worker_processes auto` |
| Frontend (static) | ~10MB | Nginx serve static |
| **Total** | **~1GB** | **Headroom ~3GB untuk Hermes** |

### Go Memory Limit

```bash
# Di systemd service atau Docker
Environment=GOMEMLIMIT=200MiB
```

---

## 🔐 Security Checklist

- [ ] `SESSION_SECRET` & `JWT_SECRET` 32+ chars random
- [ ] `SERVICE_TOKEN` 32+ chars random, beda dari JWT secret
- [ ] `DB_PASSWORD` strong, unik
- [ ] `CORS_ALLOWED_ORIGINS` hanya domain frontend (no `*` di production)
- [ ] `DB_SSL_MODE=require` di production (with certs)
- [ ] Nginx rate limiting pada `/api/v1/auth/login`
- [ ] Firewall: hanya port 22, 80, 443 terbuka publik
- [ ] Fail2ban untuk SSH
- [ ] Regular `apt update && apt upgrade`
- [ ] Backup database terenkripsi & offsite

---

## 📞 Support & Resources

| Resource | Link |
|----------|------|
| Repository | https://github.com/Adityanrrhm/la-peace |
| Issues | https://github.com/Adityanrrhm/la-peace/issues |
| Backend API Docs | `backend/docs/openapi.yaml` |
| Hermes Guide | `backend/docs/HERMES_INTEGRATION.md` |

---

## 📝 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-04 | Initial release: Backend Phases 1-4, Frontend Phases 1-4 |

---

*Dokumen ini di-maintain sebagai bagian dari repo Tagira. Update saat ada perubahan arsitektur/deployment.*