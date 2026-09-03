#!/bin/bash
set -e

# Tagira Deployment Script
# Usage: ./deploy.sh [production|staging]

ENVIRONMENT=${1:-production}
APP_DIR="/opt/tagira"
SERVICE_NAME="tagira-api"

echo "=== Tagira Deployment ==="
echo "Environment: $ENVIRONMENT"
echo "App directory: $APP_DIR"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   exit 1
fi

# Create app user if not exists
if ! id "tagira" &>/dev/null; then
    useradd -r -s /bin/false -d /opt/tagira tagira
    echo "Created user 'tagira'"
fi

# Create app directory
mkdir -p $APP_DIR
chown tagira:tagira $APP_DIR

# Build binary
echo "Building binary..."
sudo -u tagira CGO_ENABLED=0 go build -o $APP_DIR/tagira-api cmd/api/main.go

# Copy migrations
cp -r migrations $APP_DIR/
chown -R tagira:tagira $APP_DIR/migrations

# Copy systemd service
cp deploy/tagira-api.service /etc/systemd/system/

# Create .env file if not exists
if [ ! -f $APP_DIR/.env ]; then
    echo "Creating .env template at $APP_DIR/.env"
    cat > $APP_DIR/.env << EOF
# App
APP_ENV=$ENVIRONMENT
APP_PORT=8080
APP_HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=tagira
DB_PASSWORD=CHANGE_ME
DB_NAME=tagira
DB_SSL_MODE=disable
DB_MAX_OPEN_CONNS=10
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=300

# Auth
SESSION_SECRET=CHANGE_ME_32_CHARS_MINIMUM
JWT_SECRET=CHANGE_ME_32_CHARS_MINIMUM_FOR_JWT
JWT_EXPIRE_HOURS=24
SERVICE_TOKEN=CHANGE_ME_HERMES_TOKEN

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com
CORS_ALLOW_CREDENTIALS=true

# Rate Limit
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

# Logging
LOG_FORMAT=json
LOG_LEVEL=info
EOF
    chown tagira:tagira $APP_DIR/.env
    echo "IMPORTANT: Edit $APP_DIR/.env with production values before starting!"
fi

# Run migrations
echo "Running migrations..."
sudo -u tagira $APP_DIR/tagira-api migrate

# Reload systemd
systemctl daemon-reload

# Enable and start service
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME

echo "=== Deployment Complete ==="
echo "Service status:"
systemctl status $SERVICE_NAME --no-pager
echo ""
echo "To view logs: journalctl -u $SERVICE_NAME -f"
echo "To check health: curl http://localhost:8080/health"