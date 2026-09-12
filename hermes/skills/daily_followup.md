# Skill: Daily Invoice Follow-up

Automated payment reminder cycle for Tagira. Runs once per day at 09:00 WIB.

Implemented and verified by `run_daily.mjs` in this folder (no dependencies,
Node 18+). The skill below documents the contract; the script is the reference
execution. To run manually: `node run_daily.mjs`.

## Inputs (from environment)

- `TAGIRA_API_URL` — Tagira API base URL, e.g. `http://localhost:8080/api/v1`
- `SERVICE_TOKEN` — shared secret, sent as `X-Service-Token` header on every call
- `TELEGRAM_BOT_TOKEN` — bot used to message customers and the owner
- `OWNER_CHAT_ID` — Telegram chat ID of the business owner

## Procedure

1. Fetch due invoices:

   ```
   GET {TAGIRA_API_URL}/invoices/due-today
   Header: X-Service-Token: {SERVICE_TOKEN}
   ```

   Returns invoices with status `belum_bayar` or `terlambat` that are due today or overdue. Empty `data` array means nothing to do today; still continue to step 5.

2. For each invoice in `data`:

   a. Generate a personalized payment reminder with the LLM, in Indonesian, polite UMKM tone. Use `customer_name`, `jumlah` (format as Rupiah, e.g. Rp1.500.000), `jatuh_tempo`. Overdue invoices (`terlambat`) get a firmer but still respectful tone. One short paragraph, no more than 3 sentences. Never invent amounts or dates.

   b. Send the message to the customer's Telegram chat. Each due-today item already carries `kontak_telegram` (seeded by the backend for Hermes); strip the `@` prefix when calling the Bot API. If the customer has no `kontak_telegram` or the send fails, skip to the next invoice and note the failure.

   c. Log the follow-up in Tagira:

   ```
   POST {TAGIRA_API_URL}/follow-up-logs
   Headers: X-Service-Token: {SERVICE_TOKEN}, Content-Type: application/json
   {
     "invoice_id": "<invoice id>",
     "isi_pesan": "<message that was sent>",
     "sumber": "hermes"
   }
   ```

   Always set `sumber` to `"hermes"`. This marks the log as automated in the dashboard.

3. After all invoices, fetch the daily summary:

   ```
   GET {TAGIRA_API_URL}/summary/daily
   Header: X-Service-Token: {SERVICE_TOKEN}
   ```

4. Compose a short owner report in Indonesian: number of reminders sent, total outstanding (`total_belum`), total overdue (`total_terlambat`), plus any failed sends from step 2b. Send it to `OWNER_CHAT_ID` via the Telegram bot.

5. Done until the next scheduled run.

## Error handling

- Non-200 from Tagira: retry once after 30 seconds, then abort the run and message `OWNER_CHAT_ID` with the failing endpoint and status code.
- Never retry a `POST /follow-up-logs` that returned 2xx; duplicate logs corrupt history.
- Rate limit is 100 requests/minute per token; batch sizes here stay well below it.

## Schedule

Daily at 09:00 WIB (UTC+7), cron: `0 9 * * *` with `TZ=Asia/Jakarta`.
