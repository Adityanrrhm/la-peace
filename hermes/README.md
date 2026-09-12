# Tagira Hermes Integration

Hermes Agent configuration for automated daily invoice follow-up. Hermes is a
separate runtime — it lives outside this repo's Go/Next.js code and talks to the
Tagira API over HTTP. This folder only version-controls its configuration.

Full API reference: `../backend/docs/HERMES_INTEGRATION.md` and
`../backend/docs/openapi.yaml`.

## Run

```bash
cd hermes
cp .env.example .env   # fill SERVICE_TOKEN, TELEGRAM_BOT_TOKEN, OWNER_CHAT_ID, LLM_API_KEY
node run_daily.mjs     # one full cycle; exit 0 even when individual sends fail
```

Daily automation: cron `0 9 * * *` with `TZ=Asia/Jakarta`, `node run_daily.mjs`.
LLM: OpenRouter `upstage/solar-pro4`, plain REST (no SDK needed).

Drill flags (create empty marker file in `hermes/`, delete after):

| File | Effect |
|---|---|
| `DRY_RUN` | Full read path runs; prints messages + report, sends nothing, writes no logs, exit 0. |
| `LLM_OUTAGE` | Skips OpenRouter; sends fixed Indonesian template messages (tone still per status). Simulates LLM provider being down. |

LLM model overridable via `LLM_MODEL` in `.env`. Without `DRY_RUN`/`LLM_OUTAGE`
the script runs the real cycle: LLM messages, Telegram sends, log writes.

## Setup

1. **Service token.** One shared secret, self-issued:

   ```bash
   openssl rand -hex 32
   ```

   Put the same value in:
   - `backend/.env` → `SERVICE_TOKEN=<value>` (restart `make run` after changing)
   - `hermes/.env` → `SERVICE_TOKEN=<value>` (copy from `.env.example`)

2. **Auth model.** Least privilege (verified 2026-09-12):

   | Endpoint | Session (dashboard) | Service token (Hermes) |
   |---|---|---|
   | `GET /invoices/due-today` | 401 | 200 (token-only) |
   | `GET /invoices`, `GET /customers` (reads) | 200 | 200 (dual-mode) |
   | Writes (create/update/delete) | 200 | 403 |

   Token auth is `X-Service-Token` header, checked in
   `backend/internal/middleware/auth.go`.

3. **Telegram.** Create the bot with @BotFather, get `TELEGRAM_BOT_TOKEN` and
   the owner's `OWNER_CHAT_ID`. Customers must message the bot first before it
   can DM them (Telegram rule).

4. **Skill.** Point Hermes at `skills/daily_followup.md`. It defines the daily
   09:00 WIB cycle: fetch due invoices → LLM-generate Indonesian reminders →
   send via Telegram → log with `sumber: "hermes"` → owner summary report.

## Smoke test

```bash
curl -H "X-Service-Token: $SERVICE_TOKEN" \
  localhost:8080/api/v1/invoices/due-today
```

200 with an invoice array = token flow works. 401 = token mismatch or backend
not restarted. 403 = auth middleware routing changed; see `auth.go`.

## Notes

- `backend/.env` values are weak-placeholder-checked in production
  (`backend/internal/config/validate.go`); never ship a token containing
  "hermes" or "change_me".
- Follow-up logs written by Hermes appear in the dashboard marked "Hermes"
  (`frontend` reads `sumber`).
