#!/usr/bin/env bash
# Hermes bootstrap for Tagira (VPS deploy).
# Ports skill, persona, and daily cron job in one run.
# .env is created from .env.example and filled interactively (skip on non-tty, keep existing values).
set -euo pipefail

HERMES_DIR="${HERMES_DIR:-$HOME/.hermes}"
HERE="$(cd "$(dirname "$0")" && pwd)"

command -v hermes >/dev/null 2>&1 || {
  echo "hermes binary not found. Install first, e.g.: curl -fsSL https://hermes-agent.dev/install.sh | bash"
  exit 1
}

mkdir -p "$HERMES_DIR/skills"
cp -R "$HERE/skills"/* "$HERMES_DIR/skills/"
cp "$HERE/SOUL.md" "$HERMES_DIR/SOUL.md"

if [ -f "$HERE/.env" ]; then
  cp "$HERE/.env" "$HERMES_DIR/.env"
fi
if [ ! -f "$HERMES_DIR/.env" ]; then
  if [ -f "$HERE/.env.example" ]; then
    cp "$HERE/.env.example" "$HERMES_DIR/.env"
  else
    : > "$HERMES_DIR/.env"
  fi
fi

if { [ -t 0 ] || [ "${FORCE_INTERACTIVE:-0}" = 1 ]; } && [ -f "$HERE/.env.example" ]; then
  TMP="$HERMES_DIR/.env.tmp"
  : > "$TMP"
  for KEY in $(grep -E '^[A-Z_][A-Z0-9_]*=' "$HERE/.env.example" | cut -d= -f1); do
    OLD=$(sed -n "s/^${KEY}=//p" "$HERMES_DIR/.env" | tail -1)
    read -rp "${KEY} (keep: ${OLD:-<empty>}): " VAL
    VAL="${VAL:-$OLD}"
    printf '%s=%s\n' "$KEY" "$VAL" >> "$TMP"
  done
  mv "$TMP" "$HERMES_DIR/.env"
  echo "Wrote $HERMES_DIR/.env"
else
  echo "Non-interactive run (or no .env.example) — keeping existing $HERMES_DIR/.env"
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