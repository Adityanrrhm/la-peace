#!/usr/bin/env bash
# Hermes bootstrap for Tagira (VPS deploy).
# Ports skill, persona, and daily cron job in one run. Secrets via .env.
set -euo pipefail

HERMES_DIR="${HERMES_DIR:-$HOME/.hermes}"
HERE="$(cd "$(dirname "$0")" && pwd)"

command -v hermes >/dev/null 2>&1 || {
  echo "hermes binary not found. Install first, e.g.: curl -fsSL https://hermes-agent.dev/install.sh | bash"
  exit 1
}

mkdir -p "$HERMES_DIR/skills"
cp -R "$HERE/skills/tagira" "$HERMES_DIR/skills/"
cp "$HERE/SOUL.md" "$HERMES_DIR/SOUL.md"

if [ -f "$HERE/.env" ]; then
  cp "$HERE/.env" "$HERMES_DIR/.env"
else
  echo "WARN: no .env here — cp .env.example .env, fill TAGIRA_SERVICE_TOKEN + telegram values"
fi

# shellcheck disable=SC1090
[ -f "$HERMES_DIR/.env" ] && set -a && . "$HERMES_DIR/.env" && set +a

if hermes cron list 2>/dev/null | grep -q tagira-daily; then
  echo "cron tagira-daily exists — skip"
else
  hermes cron create \
    --name tagira-daily \
    --skill tagira \
    --deliver "telegram:${TELEGRAM_HOME_CHANNEL}" \
    '0 9 * * *' \
    "Run the Tagira daily invoice follow-up workflow end to end (skill: tagira)."
fi

hermes gateway start

echo "Done. Verify:"
echo "  hermes skills list | grep tagira"
echo "  hermes cron list"