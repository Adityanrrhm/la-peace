#!/usr/bin/env bash
# Tagira API smoke test. Read-only. Exit 0 = all ok, 1 = any fail.
# Env: TAGIRA_URL, TAGIRA_SERVICE_TOKEN (or SERVICE_TOKEN).
set -uo pipefail

BASE_URL="${TAGIRA_URL:-http://localhost:8080}"

HERE="$(cd "$(dirname "$0")" && pwd)"
[ -f "$HERE/../.env" ] && set -a && . "$HERE/../.env" && set +a

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

check api-up "$BASE_URL/health" '"status":"ok"'
check due-today "$BASE_URL/api/v1/invoices/due-today" '"success":true' -H "X-Service-Token: $TOKEN"
check summary "$BASE_URL/api/v1/summary/daily" '"success":true' -H "X-Service-Token: $TOKEN"

exit "$ok"