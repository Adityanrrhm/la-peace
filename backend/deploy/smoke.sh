#!/usr/bin/env bash
# Tagira smoke test. Read-only. Exit 0 = all ok, 1 = any fail.
# Env: TAGIRA_URL, TAGIRA_SERVICE_TOKEN (or SERVICE_TOKEN).
set -uo pipefail

BACKEND_URL="${TAGIRA_URL:-http://localhost:8080}"
FRONTEND_URL="${TAGIRA_FRONTEND_URL:-http://localhost:3000}"

# Load .env from known locations
HERE="$(cd "$(dirname "$0")" && pwd)"
for env_file in "$HERE/../.env" /opt/tagira/.env; do
  [ -f "$env_file" ] && set -a && . "$env_file" && set +a && break
done

TOKEN="${TAGIRA_SERVICE_TOKEN:-${SERVICE_TOKEN:-}}"
[ -n "$TOKEN" ] || { echo "SMOKE FAIL: no SERVICE_TOKEN set" >&2; exit 1; }

ok=0

check() {
  local name="$1" url="$2" match="${3:-"\"success\":true"}"
  local out
  out=$(curl --fail --silent --show-error --max-time 10 "${@:4}" "$url") || {
    echo "SMOKE FAIL: $name ($url)" >&2
    ok=1
    return
  }
  echo "$out" | grep -q "$match" || {
    echo "SMOKE FAIL: $name match=$match" >&2
    ok=1
    return
  }
  echo "ok: $name"
}

# Backend
check api-up "$BACKEND_URL/health" '"status":"ok"'
check due-today "$BACKEND_URL/api/v1/invoices/due-today" '"success":true' -H "X-Service-Token: $TOKEN"
check summary "$BACKEND_URL/api/v1/summary/daily" '"success":true' -H "X-Service-Token: $TOKEN"

# Frontend
FRONTEND_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 5 "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "ok: frontend ($FRONTEND_URL)"
else
  echo "SMOKE FAIL: frontend ($FRONTEND_URL) status=$FRONTEND_STATUS" >&2
  ok=1
fi

exit "$ok"
