#!/bin/bash
set -euo pipefail

# Tagira — Full VPS Setup (idempotent, no Nginx)
# Usage: sudo bash setup-vps.sh
# Access: http://YOUR_IP:8080

APP_DIR="/opt/tagira"
SERVICE_NAME="tagira-api"
DB_USER="tagira"
DB_NAME="tagira"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

# ── Check existing setup ───────────────────────────────────────────
EXISTING_SETUP=false
if [ -f "$APP_DIR/.env" ]; then
  EXISTING_SETUP=true
  echo "Existing .env found. Reusing credentials."
  # Source existing secrets so DB password stays in sync
  set -a
  . "$APP_DIR/.env"
  set +a
  DB_PASS="$DB_PASSWORD"
else
  DB_PASS=$(openssl rand -base64 18)
  SESSION_SECRET=$(openssl rand -base64 32)
  JWT_SECRET=$(openssl rand -base64 32)
  SERVICE_TOKEN=$(openssl rand -hex 32)
fi

echo "=== Tagira VPS Setup ==="
echo "Access after setup: http://$(hostname -I | awk '{print $1}'):8080"
echo ""

# ── 1. System deps ──────────────────────────────────────────────────
echo "[1/5] Installing system dependencies..."
apt update && apt upgrade -y
apt install -y postgresql

# Go
if ! command -v go &>/dev/null; then
  GO_VER="1.22.3"
  wget -q "https://go.dev/dl/go${GO_VER}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
  tar -C /usr/local -xzf /tmp/go.tar.gz
  echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile.d/go.sh
  export PATH=$PATH:/usr/local/go/bin
  rm /tmp/go.tar.gz
  echo "  Installed Go ${GO_VER}"
else
  echo "  Go already installed: $(go version)"
fi

# ── 2. PostgreSQL ──────────────────────────────────────────────────
echo "[2/5] Setting up PostgreSQL..."
systemctl enable --now postgresql

PG_USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" 2>/dev/null || true)
if [ "$PG_USER_EXISTS" = "1" ]; then
  if [ "$EXISTING_SETUP" = false ]; then
    sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" >/dev/null
    echo "  DB user exists. Password rotated."
  else
    echo "  DB user exists. Reusing."
  fi
else
  sudo -u postgres psql <<EOSQL
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOSQL
  echo "  DB user + database created."
fi

PG_DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null || true)
if [ "$PG_DB_EXISTS" != "1" ]; then
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" >/dev/null
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" >/dev/null
  echo "  Database created."
else
  echo "  Database exists."
fi

# Tune — detect PG version
PG_VER=$(ls /etc/postgresql/ | head -1)
cat > "/etc/postgresql/${PG_VER}/main/conf.d/tagira.conf" <<EOF
shared_buffers = 512MB
effective_cache_size = 1536MB
max_connections = 100
work_mem = 4MB
maintenance_work_mem = 128MB
EOF
systemctl restart postgresql

# ── 3. App user + directory ────────────────────────────────────────
echo "[3/5] Creating app user and directory..."
if ! id "tagira" &>/dev/null; then
  useradd -r -s /bin/false -d "$APP_DIR" tagira
fi
mkdir -p "$APP_DIR"
chown tagira:tagira "$APP_DIR"

# ── 4. Build & deploy backend ──────────────────────────────────────
echo "[4/5] Building backend..."
cd "$(dirname "$0")/.."
CGO_ENABLED=0 go build -o "$APP_DIR/tagira-api" cmd/api/main.go
cp -r migrations "$APP_DIR/"
chown -R tagira:tagira "$APP_DIR"

# .env
if [ "$EXISTING_SETUP" = false ]; then
  cat > "$APP_DIR/.env" <<EOF
APP_ENV=production
APP_PORT=8080
APP_HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_NAME=${DB_NAME}
DB_SSL_MODE=disable
DB_MAX_OPEN_CONNS=10
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=300

SESSION_SECRET=${SESSION_SECRET}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE_HOURS=24
SERVICE_TOKEN=${SERVICE_TOKEN}

CORS_ALLOWED_ORIGINS=*
CORS_ALLOW_CREDENTIALS=true

RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

FRONTEND_DIR=${APP_DIR}/frontend

LOG_FORMAT=json
LOG_LEVEL=info
EOF
  chown tagira:tagira "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo "  .env created."
else
  echo "  .env exists. Skipping."
fi

# Systemd
cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=Tagira API
After=network.target postgresql.service

[Service]
Type=simple
User=tagira
Group=tagira
WorkingDirectory=${APP_DIR}
ExecStart=${APP_DIR}/tagira-api
Restart=always
RestartSec=5
Environment=GOMEMLIMIT=200MiB

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

# Migrate — cd into APP_DIR so .env is found
sudo -u tagira env HOME="$APP_DIR" bash -c "cd $APP_DIR && $APP_DIR/tagira-api -migrate"
echo "  Backend running on :8080"

# ── 5. Frontend (static export) ────────────────────────────────────
echo "[5/5] Building frontend..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/../../frontend"
if [ -d "$FRONTEND_DIR" ] && [ -f "$FRONTEND_DIR/package.json" ]; then
  cd "$FRONTEND_DIR"
  npm install --production=false
  npm run build
  mkdir -p "$APP_DIR/frontend"
  rm -rf "$APP_DIR/frontend"/*
  cp -r out/* "$APP_DIR/frontend/"
  chown -R tagira:tagira "$APP_DIR/frontend"
  echo "  Frontend copied to $APP_DIR/frontend"
else
  echo "  SKIP: frontend not found at $FRONTEND_DIR"
  echo "  Build frontend separately, then copy to $APP_DIR/frontend/"
fi

# ── Done ───────────────────────────────────────────────────────────
IP=$(hostname -I | awk '{print $1}')
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Access:          http://${IP}:8080"
echo ""
if [ "$EXISTING_SETUP" = false ]; then
  echo "Credentials (SAVE THESE NOW):"
  echo "  DB password:      ${DB_PASS}"
  echo "  SERVICE_TOKEN:    ${SERVICE_TOKEN}"
  echo ""
fi
echo "Secrets file:      ${APP_DIR}/.env"
echo "Health check:      curl http://localhost:8080/health"
echo "Logs:              journalctl -u ${SERVICE_NAME} -f"
echo ""
echo "Firewall: Open port 8080 if needed: sudo ufw allow 8080/tcp"
