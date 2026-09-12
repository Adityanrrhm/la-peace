#!/usr/bin/env node
// Daily invoice follow-up: Tagira due-today -> LLM reminder -> Telegram -> follow-up log -> owner summary.
// No dependencies: plain fetch (Node 18+). Run: node run_daily.mjs  (cron: 0 9 * * * TZ=Asia/Jakarta)
// Dry run (no Telegram sends, no log writes): touch DRY_RUN then node run_daily.mjs (delete DRY_RUN after).
// LLM-outage drill (template messages): touch LLM_OUTAGE then node run_daily.mjs (delete after).

import { readFileSync, existsSync } from 'node:fs';

const dryRun = existsSync(new URL('./DRY_RUN', import.meta.url));
const llmOutage = existsSync(new URL('./LLM_OUTAGE', import.meta.url));
if (dryRun) console.log('*** DRY RUN — no Telegram sends, no log writes ***');
if (llmOutage) console.log('*** LLM_OUTAGE — template messages instead of LLM ***');

const env = Object.fromEntries(
  readFileSync(new URL('./.env', import.meta.url), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('=').map(s => s.trim())).filter(p => p.length >= 2 && p[0])
    .map(p => [p[0], p.slice(1).join('=')])
);
const { TAGIRA_API_URL, SERVICE_TOKEN, TELEGRAM_BOT_TOKEN, OWNER_CHAT_ID, LLM_API_KEY } = env;
for (const [k, v] of Object.entries({ TAGIRA_API_URL, SERVICE_TOKEN, TELEGRAM_BOT_TOKEN, LLM_API_KEY })) {
  if (!v) { console.error(`Missing ${k} in hermes/.env`); process.exit(1); }
}
const LLM_MODEL = env.LLM_MODEL || 'upstage/solar-pro4';

const api = async (path, opts = {}) => {
  const res = await fetch(`${TAGIRA_API_URL}${path}`, {
    ...opts,
    headers: { 'X-Service-Token': SERVICE_TOKEN, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${body?.error?.message || ''}`);
  return body.data;
};

const generateMessage = async (inv) => {
  const rp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(inv.jumlah);
  if (llmOutage) {
    const overdue = inv.status === 'terlambat';
    return overdue
      ? `Yth. ${inv.customer_name}, tagihan Tagira sebesar ${rp} telah melewati jatuh tempo (${inv.jatuh_tempo}). Mohon segera lakukan pembayaran. Terima kasih.`
      : `Halo ${inv.customer_name}, mengingatkan tagihan Tagira sebesar ${rp} yang jatuh tempo hari ini (${inv.jatuh_tempo}). Mohon lakukan pembayaran. Terima kasih.`;
  }
  const overdue = inv.status === 'terlambat';
  const prompt = `Kamu asisten penagihan UMKM "Tagira". Tulis pesan pengingat pembayaran Telegram dalam bahasa Indonesia, santun, maksimal 3 kalimat, tanpa format markdown.
Customer: ${inv.customer_name}. Nominal: ${rp}. Jatuh tempo: ${inv.jatuh_tempo}. Status: ${overdue ? 'sudah lewat jatuh tempo' : 'jatuh tempo hari ini'}.
${overdue ? 'Nada lebih tegas tapi tetap hormat, ingatkan keterlambatan.' : 'Nada ramah pengingat biasa.'}
Akhiri dengan ajakan segera membayar. Jangan mengarang angka atau tanggal lain.`;
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LLM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: LLM_MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 200 }),
  });
  const data = await res.json();
  const msg = data.choices?.[0]?.message?.content?.trim();
  if (!msg) throw new Error(`LLM: ${res.status} ${JSON.stringify(data.error || data).slice(0, 200)}`);
  return msg;
};

const sendTelegram = async (chatId, text) => {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram ${chatId}: ${data.error_code} ${data.description}`);
};

const failures = [];
let sent = 0;

try {
  const due = await api('/invoices/due-today');
  console.log(`Due invoices: ${due.length}`);

  for (const inv of due) {
    try {
      if (!inv.kontak_telegram) throw new Error('no kontak_telegram');
      const chatId = inv.kontak_telegram.replace('@', '');
      const message = await generateMessage(inv);
      if (dryRun) {
        console.log(`[dry] would send to ${chatId}:\n  ${message.replace(/\n/g, '\n  ')}`);
        sent++;
        continue;
      }
      await sendTelegram(chatId, message);
      await api('/follow-up-logs', {
        method: 'POST',
        body: JSON.stringify({ invoice_id: inv.id, isi_pesan: message, sumber: 'hermes' }),
      });
      sent++;
      console.log(`OK ${inv.customer_name} (${chatId})`);
    } catch (e) {
      failures.push(`${inv.customer_name}: ${e.message}`);
      console.error(`FAIL ${inv.customer_name}: ${e.message}`);
    }
  }

  const s = await api('/summary/daily');
  const report = [
    `Laporan Tagira ${new Date().toLocaleDateString('id-ID')}`,
    `Reminder terkirim: ${sent}/${due.length}`,
    `Belum dibayar: ${Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(s.total_belum)} (${s.belum_bayar} invoice)`,
    `Terlambat: ${Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(s.total_terlambat)} (${s.terlambat} invoice)`,
    failures.length ? `Gagal:\n${failures.map(f => `- ${f}`).join('\n')}` : 'Tidak ada kegagalan.',
  ].join('\n');
  console.log('\n' + report);

  if (dryRun) {
    console.log('\n(dry run — owner report not sent)');
    process.exit(0);
  }

  if (OWNER_CHAT_ID) {
    await sendTelegram(OWNER_CHAT_ID, report);
  } else {
    console.log('\nOWNER_CHAT_ID not set — report not sent. Fill it in hermes/.env.');
  }
} catch (e) {
  console.error('Fatal:', e.message);
  process.exit(1);
}
