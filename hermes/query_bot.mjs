#!/usr/bin/env node
// Telegram query bot: owner asks in chat, Hermes answers from Tagira data via LLM.
// Triggers: DM, @mention in group, or reply to any bot message. Bot answers as threaded reply.
// Agent actions: set_status, create, edit, delete (invoices); customer add/delete/rename.
// Deletes (one/multi/all) always ask "ya"/"batal" first.
// Fast paths (no LLM) for the commands listed in the Telegram bot menu; other text goes to the LLM.
// No dependencies (Node 18+). Run: node query_bot.mjs   Stop: touch STOP (or STOP_FILE from .env).

import { readFileSync, existsSync, rmSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('./.env', import.meta.url), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('=').map(s => s.trim())).filter(p => p.length >= 2 && p[0])
    .map(p => [p[0], p.slice(1).join('=')])
);
const { TAGIRA_API_URL, SERVICE_TOKEN, TELEGRAM_BOT_TOKEN, OWNER_CHAT_ID, LLM_API_KEY } = env;
const LLM_MODEL = env.LLM_MODEL || 'upstage/solar-pro4';
const STOP_FILE = env.STOP_FILE || 'STOP';
if (!TAGIRA_API_URL || !SERVICE_TOKEN || !TELEGRAM_BOT_TOKEN || !LLM_API_KEY) {
  console.error('Missing TAGIRA_API_URL / SERVICE_TOKEN / TELEGRAM_BOT_TOKEN / LLM_API_KEY in hermes/.env');
  process.exit(1);
}

const api = async (path) => {
  const res = await fetch(`${TAGIRA_API_URL}${path}`, { headers: { 'X-Service-Token': SERVICE_TOKEN } });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${body?.error?.message || ''}`);
  return body.data;
};

const rp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

// Per-chat conversation memory (RAM only, wiped on restart). Last 8 turns feed
// both LLM calls so follow-ups like "jadikan lunas kembali" resolve.
const chatMemory = new Map();
// chatId -> pending irreversible action awaiting "ya"/"batal" (currently: delete).
const pendingAction = new Map();
const remember = (chatId, role, text) => {
  const h = chatMemory.get(chatId) || [];
  h.push({ role, text });
  if (h.length > 8) h.splice(0, h.length - 8);
  chatMemory.set(chatId, h);
};
const transcript = (chatId) =>
  (chatMemory.get(chatId) || []).map(t => `${t.role === 'user' ? 'Owner' : 'Bot'}: ${t.text}`).join('\n');

// Context the LLM reasons over. ponytail: fetch-all pages, add intent routing if data outgrows this.
const buildContext = async () => {
  const [summary, invoices, customers] = await Promise.all([
    api('/summary/daily'),
    api('/invoices?page=1&page_size=100'),
    api('/customers?page=1&page_size=100'),
  ]);
  return JSON.stringify({
    ringkasan: summary,
    invoices: (invoices.invoices || []).map(i => ({
      customer: i.customer_name, jumlah: rp(i.jumlah), status: i.status,
      jatuh_tempo: i.jatuh_tempo, id: i.id,
    })),
    customers: (customers.customers || []).map(c => ({ nama: c.nama, telegram: c.kontak_telegram, id: c.id })),
  });
};

const answer = async (question, context, chatId) => {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LLM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LLM_MODEL,
      max_tokens: 400,
      messages: [
        { role: 'system', content: `Kamu asisten bisnis "Tagira" untuk owner UMKM. Jawab pertanyaan HANYA dari data JSON berikut, bahasa Indonesia, singkat, tanpa markdown. Gunakan konteks percakapan untuk pertanyaan lanjutan. Jika data tidak memuat jawabannya, bilang jujur tidak tahu. Percakapan sebelumnya:\n${transcript(chatId)}\nData: ${context}` },
        { role: 'user', content: question },
      ],
    }),
  });
  const data = await res.json();
  const msg = data.choices?.[0]?.message?.content?.trim();
  if (!msg) throw new Error(`LLM: ${res.status} ${JSON.stringify(data.error || data).slice(0, 200)}`);
  return msg;
};

// Guards: only exact single unpaid invoice matches; ambiguity asks back, never guesses.
const STATUSES = ['belum_bayar', 'lunas', 'terlambat'];

const resolveCustomer = async (name) => {
  const cust = await api('/customers?page=1&page_size=100');
  const matches = (cust.customers || []).filter(c => c.nama.toLowerCase().includes(String(name).toLowerCase()));
  if (matches.length === 0) return { error: `Customer "${name}" tidak ditemukan. Cek /customer <nama>.` };
  if (matches.length > 1) return { error: `Nama ambigu: ${matches.map(c => c.nama).join(', ')}. Sebut satu nama.` };
  return { customer: matches[0] };
};

const setStatusFor = async (name, status) => {
  const r = await resolveCustomer(name);
  if (r.error) return r.error;
  const c = r.customer;
  const inv = await api('/invoices?page=1&page_size=100');
  const candidates = (inv.invoices || []).filter(i => i.customer_id === c.id && i.status !== status);
  if (candidates.length === 0) return `Semua invoice ${c.nama} sudah ${status}.`;
  if (candidates.length > 1) return `${c.nama} punya ${candidates.length} invoice yang bisa diubah ke ${status}:\n` +
    candidates.map(i => `${rp(i.jumlah)} tempo ${i.jatuh_tempo} (${i.status})`).join('\n') + '\nSebut nominalnya yang mana.';
  const target = candidates[0];
  const res2 = await fetch(`${TAGIRA_API_URL}/invoices/${target.id}/status`, {
    method: 'PATCH', headers: { 'X-Service-Token': SERVICE_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res2.ok) throw new Error(`PATCH status -> ${res2.status}`);
  return `✓ ${c.nama}: ${rp(target.jumlah)} (tempo ${target.jatuh_tempo}) → ${status}.`;
};

const deleteFor = async (name, scope, jumlah) => {
  let rows, label;
  if (!name || String(name).trim() === '' || /^(semua|all|semua invoice)$/i.test(String(name).trim())) {
    if (scope !== 'all') return 'Hapus milik siapa? Sebut nama customer, atau "hapus semua invoice".';
    const inv = await api('/invoices?page=1&page_size=100');
    rows = inv.invoices || [];
    label = 'invoice (SEMUA)';
  } else {
    const r = await resolveCustomer(name);
    if (r.error) return r.error;
    const inv = await api('/invoices?page=1&page_size=100');
    rows = (inv.invoices || []).filter(i => i.customer_id === r.customer.id);
    if (jumlah) rows = rows.filter(i => i.jumlah === Number(jumlah));
    if (!rows.length) return `${r.customer.nama} tidak punya invoice yang cocok untuk dihapus.`;
    if (rows.length > 1 && scope !== 'all' && !jumlah) return `${r.customer.nama} punya ${rows.length} invoice:\n` +
      rows.map(i => `${rp(i.jumlah)} tempo ${i.jatuh_tempo} (${i.status})`).join('\n') + '\nSebut nominalnya, atau "hapus semua invoice <nama>".';
    label = `invoice ${r.customer.nama}`;
  }
  if (!rows.length) return 'Tidak ada invoice untuk dihapus.';
  const list = rows.map(i => `${rp(i.jumlah)} tempo ${i.jatuh_tempo} (${i.status})`).join('\n');
  return { pending: { kind: 'delete', ids: rows.map(i => i.id), summary: `Hapus ${rows.length} ${label} (permanen, termasuk log follow-up):\n${list}\nBalas "ya" untuk hapus, "batal" untuk batal.` } };
};

const addCustomer = async (nama, telegram) => {
  if (!nama) return 'Pakai: /customer add <nama> [telegram]. Contoh: /customer add Budi @budisantoso';
  const res = await fetch(`${TAGIRA_API_URL}/customers`, {
    method: 'POST', headers: { 'X-Service-Token': SERVICE_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama, kontak_telegram: telegram || undefined }),
  });
  if (!res.ok) throw new Error(`POST customers -> ${res.status}`);
  return `✓ Customer "${nama}" ditambahkan${telegram ? ` (Telegram: ${telegram})` : ''}.`;
};

const deleteCustomer = async (name) => {
  const r = await resolveCustomer(name);
  if (r.error) return r.error;
  const c = r.customer;
  const inv = await api('/invoices?page=1&page_size=100');
  const count = (inv.invoices || []).filter(i => i.customer_id === c.id).length;
  if (count > 0) return `${c.nama} masih punya ${count} invoice. Hapus invoice-nya dulu, lalu ulangi.`;
  return { pending: { kind: 'delete_customer', ids: [c.id], summary: `Hapus customer "${c.nama}" (permanen)?\nBalas "ya" untuk hapus, "batal" untuk batal.` } };
};

const renameCustomer = async (name, newName) => {
  const r = await resolveCustomer(name);
  if (r.error) return r.error;
  const res = await fetch(`${TAGIRA_API_URL}/customers/${r.customer.id}`, {
    method: 'PATCH', headers: { 'X-Service-Token': SERVICE_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama: newName }),
  });
  if (!res.ok) throw new Error(`PATCH customer -> ${res.status}`);
  return `✓ Customer "${r.customer.nama}" → "${newName}".`;
};

const createFor = async (a) => {
  if (!a.customer || !a.jumlah) return 'Buat invoice butuh nama customer + nominal. Contoh: "buat invoice Elza 500000" (tempo default +14 hari).';
  const r = await resolveCustomer(a.customer);
  if (r.error) return r.error;
  const body = {
    customer_id: r.customer.id,
    jumlah: Number(a.jumlah),
    tanggal_terbit: new Date().toISOString().slice(0, 10),
    jatuh_tempo: a.jatuh_tempo || new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
  };
  const res = await fetch(`${TAGIRA_API_URL}/invoices`, {
    method: 'POST', headers: { 'X-Service-Token': SERVICE_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST invoices -> ${res.status}`);
  return `✓ Invoice ${r.customer.nama} ${rp(body.jumlah)} dibuat, terbit ${body.tanggal_terbit}, tempo ${body.jatuh_tempo}.`;
};

const editFor = async (a) => {
  if (!a.customer) return 'Edit invoice butuh nama customer. Contoh: "edit invoice Elza 600000 jadi 750000".';
  const r = await resolveCustomer(a.customer);
  if (r.error) return r.error;
  const inv = await api('/invoices?page=1&page_size=100');
  let rows = (inv.invoices || []).filter(i => i.customer_id === r.customer.id);
  if (a.jumlah_lama) rows = rows.filter(i => i.jumlah === Number(a.jumlah_lama));
  if (!rows.length) return `${r.customer.nama} tidak punya invoice yang cocok${a.jumlah_lama ? ` dengan nominal ${rp(Number(a.jumlah_lama))}` : ''}.`;
  if (rows.length > 1) return `${r.customer.nama} punya ${rows.length} invoice:\n` +
    rows.map(i => `${rp(i.jumlah)} tempo ${i.jatuh_tempo}`).join('\n') + '\nSebut nominal lama yang mau diedit.';
  const target = rows[0];
  const body = {};
  if (a.jumlah) body.jumlah = Number(a.jumlah);
  if (a.jatuh_tempo) body.jatuh_tempo = a.jatuh_tempo;
  if (a.customer_baru) {
    const rb = await resolveCustomer(a.customer_baru);
    if (rb.error) return rb.error;
    body.customer_id = rb.customer.id;
  }
  if (!Object.keys(body).length) return 'Tidak ada perubahan terdeteksi. Contoh: "edit invoice Elza 600000 jadi 750000" atau "edit tempo Elza jadi 2026-11-01".';
  const res = await fetch(`${TAGIRA_API_URL}/invoices/${target.id}`, {
    method: 'PATCH', headers: { 'X-Service-Token': SERVICE_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH invoices -> ${res.status}`);
  return `✓ Invoice ${r.customer.nama} ${rp(target.jumlah)} diperbarui: ${Object.entries(body).map(([k, v]) => k === 'customer_id' ? `customer → ${a.customer_baru}` : `${k} → ${k === 'jumlah' ? rp(v) : v}`).join(', ')}.`;
};

const maybeAction = async (q, chatId) => {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LLM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LLM_MODEL, max_tokens: 60,
      messages: [
        { role: 'system', content: `Ekstrak aksi manajemen invoice dari pesan owner UMKM. Balas HANYA JSON, tanpa teks lain. Gunakan konteks percakapan untuk rujukan seperti "dia", "kembali", atau pesan tanpa nama; jika nama tetap tak diketahui balas {"action":"ask_name"}. Aksi:\n- {"action":"set_status","customer":"<nama>","status":"lunas|belum_bayar|terlambat"}\n- {"action":"delete","customer":"<nama>","scope":"one|all","jumlah":<nominal jika disebut>}\n- {"action":"create","customer":"<nama>","jumlah":<nominal>,"jatuh_tempo":"YYYY-MM-DD atau hilangkan"}\n- {"action":"edit","customer":"<nama>","jumlah_lama":<nominal lama jika disebut>,"jumlah":<nominal baru jika disebut>,"jatuh_tempo":"YYYY-MM-DD jika disebut","customer_baru":"<nama> jika dipindah"}\n- {"action":null} jika bukan aksi.\n"customer" = nama orang saja, tanpa kata kerja. Percakapan sebelumnya:\n${transcript(chatId)}` },
        { role: 'user', content: q },
      ],
    }),
  });
  const data = await res.json();
  let intent;
  try { intent = JSON.parse(data.choices?.[0]?.message?.content?.trim()); } catch { return null; }
  if (intent?.action === 'ask_name') return 'Ubah jadi apa? Sebut nama customer-nya (contoh: /lunas Elza).';
  if (intent?.action === 'set_status' && STATUSES.includes(intent.status)) return setStatusFor(String(intent.customer || ''), intent.status);
  if (intent?.action === 'delete') return deleteFor(intent.customer ? String(intent.customer) : '', intent.scope, intent.jumlah);
  if (intent?.action === 'create') return createFor(intent);
  if (intent?.action === 'edit' && intent.customer) return editFor(intent);
  return null;
};

// Fast paths: direct API formatting, skip LLM.
// Return null to fall through to LLM.
const fastReply = async (q) => {
  const [cmd, ...rest] = q.split(/\s+/);
  const arg = rest.join(' ').toLowerCase();
  if (cmd === '/due') {
    const due = await api('/invoices/due-today');
    if (!due.length) return 'Tidak ada invoice jatuh tempo hari ini. 🎉';
    return 'Jatuh tempo / terlambat:\n' + due.map(i => `${i.customer_name}: ${rp(i.jumlah)} — ${i.status}, tempo ${i.jatuh_tempo}`).join('\n');
  }
  if (cmd === '/summary') {
    const s = await api('/summary/daily');
    return `Ringkasan hari ini:\nBelum dibayar: ${s.belum_bayar} invoice (${rp(s.total_belum)})\nTerlambat: ${s.terlambat} invoice (${rp(s.total_terlambat)})\nLunas: ${s.lunas} invoice\nBelum ditagih: ${s.belum_tagih}`;
  }
  // /invoice <nama...> <jumlah> [tempo YYYY-MM-DD], name may contain spaces; last numeric token = jumlah.
  if (cmd === '/invoice') {
    if (rest.length < 2) return 'Pakai: /invoice <nama> <jumlah> [tempo YYYY-MM-DD]. Contoh: /invoice Elza 500000 2026-10-01';
    const maybeTempo = rest[rest.length - 1].match(/^\d{4}-\d{2}-\d{2}$/) ? rest.pop() : null;
    const jumlah = rest.pop();
    if (!/^\d+$/.test(jumlah)) return 'Nominal harus angka, contoh: /invoice Elza 500000';
    return createFor({ customer: rest.join(' '), jumlah, jatuh_tempo: maybeTempo || undefined });
  }
  if (cmd === '/lunas') {
    if (!arg) return 'Pakai: /lunas <nama>';
    return setStatusFor(arg, 'lunas');
  }
  if (cmd === '/customer') {
    const sub = rest[0];
    if (!sub) return 'Pakai: /customer <nama> | /customer add <nama> [telegram] | /customer delete <nama> | /customer rename <lama> <baru>';
    if (sub === 'add') return addCustomer(rest.slice(1).join(' '));
    if (sub === 'delete') return deleteCustomer(rest.slice(1).join(' '));
    if (sub === 'rename') return renameCustomer(rest[1], rest.slice(2).join(' '));
    const [cust, inv] = await Promise.all([api('/customers?page=1&page_size=100'), api('/invoices?page=1&page_size=100')]);
    const c = (cust.customers || []).find(c => c.nama.toLowerCase().includes(arg));
    if (!c) return `Customer "${arg}" tidak ditemukan.`;
    const rows = (inv.invoices || []).filter(i => i.customer_id === c.id);
    return `${c.nama} (${c.kontak_telegram || 'tanpa telegram'}):\n` +
      (rows.length ? rows.map(i => `${rp(i.jumlah)} — ${i.status}, tempo ${i.jatuh_tempo}`).join('\n') : 'Tidak ada invoice.');
  }
  return null;
};

const tg = async (method, body) => {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return res.json();
};

const me = await tg('getMe', {});
if (!me.ok) { console.error(`getMe failed: ${me.description}`); process.exit(1); }
const mention = `@${me.result.username}`;
console.log(`Query bot listening as ${mention}. Triggers: DM, ${mention} mention, reply to bot message. Stop: touch ${STOP_FILE}`);

let offset = 0;
while (existsSync(new URL(`./${STOP_FILE}`, import.meta.url)) === false) {
  try {
    const res = await tg('getUpdates', { offset, timeout: 25, allowed_updates: ['message'] });
    if (!res.ok) throw new Error(`getUpdates: ${res.error_code} ${res.description}`);
    for (const u of res.result) {
      offset = u.update_id + 1;
      const m = u.message;
      if (!m?.text) continue;
      const mine = m.chat.type === 'private' || m.text.includes(mention) || m.reply_to_message?.from?.id === me.result.id;
      if (!mine) continue;
      const chatId = m.chat.id;
      const question = m.text.replace(new RegExp(`${mention}\\s*`, 'g'), '').trim();
      if (!question || question === '/start') continue;
      console.log(`Q from ${(m.from?.username || m.chat.title)}: ${question}`);
      try {
        const pend = pendingAction.get(chatId);
        if (pend) {
          const t = question.toLowerCase();
          if (/^ya\b|yakin|lanjut/.test(t)) {
            pendingAction.delete(chatId);
            const results = [];
            for (const id of pend.ids) {
              const url = pend.kind === 'delete_customer' ? `${TAGIRA_API_URL}/customers/${id}` : `${TAGIRA_API_URL}/invoices/${id}`;
              const res = await fetch(url, { method: 'DELETE', headers: { 'X-Service-Token': SERVICE_TOKEN } });
              results.push(res.ok ? '✓' : `✗ ${res.status}`);
            }
            const reply = `Terhapus: ${results.filter(x => x === '✓').length}/${pend.ids.length}.\n${pend.summary.split('\n')[0]}`;
            remember(chatId, 'bot', reply);
            await tg('sendMessage', { chat_id: chatId, text: reply, reply_to_message_id: m.message_id });
            continue;
          }
          if (/^batal\b|^tidak\b|cancel/.test(t)) {
            pendingAction.delete(chatId);
            const reply = 'Dibatalkan, tidak ada yang dihapus.';
            remember(chatId, 'bot', reply);
            await tg('sendMessage', { chat_id: chatId, text: reply, reply_to_message_id: m.message_id });
            continue;
          }
          pendingAction.delete(chatId); // different instruction supersedes pending confirm
        }
        remember(chatId, 'user', question);
        const action = await maybeAction(question, chatId);
        let reply, tag = '';
        if (action && typeof action === 'object' && action.pending) {
          pendingAction.set(chatId, action.pending);
          reply = action.pending.summary;
          tag = ' (pending-confirm)';
        } else {
          const fast = action ?? await fastReply(question);
          reply = fast ?? await answer(question, await buildContext(), chatId);
          tag = fast ? (action ? ' (action)' : ' (fast)') : '';
        }
        remember(chatId, 'bot', reply);
        await tg('sendMessage', { chat_id: chatId, text: reply, reply_to_message_id: m.message_id });
        console.log(`A${tag}: ${reply.slice(0, 80)}...`);
      } catch (e) {
        await tg('sendMessage', { chat_id: chatId, text: `Maaf, gagal menjawab: ${e.message.slice(0, 150)}`, reply_to_message_id: m.message_id });
        console.error(`ERR: ${e.message}`);
      }
    }
  } catch (e) {
    console.error(e.message);
    await new Promise(r => setTimeout(r, 5000));
  }
}
if (existsSync(new URL(`./${STOP_FILE}`, import.meta.url))) rmSync(new URL(`./${STOP_FILE}`, import.meta.url));
console.log('Query bot stopped.');
