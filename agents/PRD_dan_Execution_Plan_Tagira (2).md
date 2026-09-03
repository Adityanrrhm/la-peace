# PRD & Execution Plan — Tagira
### Agent Penagihan & Follow-up Invoice Otomatis untuk UMKM (berbasis Hermes)

**Disusun oleh:** Adit
**Infrastruktur:** VPS 4 vCPU / 4GB RAM / 20GB storage
**Stack:** Next.js (frontend) + Go (backend) + PostgreSQL (database) + Hermes Agent (orkestrasi & reasoning, disambungkan di tahap lanjut)

> Catatan: "Tagira" masih working title dari sesi sebelumnya — ganti bila kamu pilih nama lain.

---

## BAGIAN 1 — PRD (Product Requirements Document)

### 1.1 Latar Belakang
UMKM umumnya menagih piutang secara manual — cek catatan, ingat siapa yang belum bayar, kirim chat satu per satu. Proses ini gampang kelewat, memakan waktu, dan sering bikin arus kas macet karena telat ditagih. Tagira dibangun untuk mengotomasi proses ini: memantau status invoice, dan secara proaktif menagih customer lewat pesan yang dipersonalisasi berdasarkan riwayat mereka.

### 1.2 Tujuan Produk
- Owner tidak perlu lagi menagih manual satu-satu.
- Setiap invoice yang jatuh tempo/terlambat otomatis terpantau dan ditindaklanjuti.
- Owner mendapat ringkasan harian yang jelas: siapa sudah ditagih, siapa sudah bayar, siapa masih perlu perhatian.
- Semua interaksi tercatat sebagai audit trail.

### 1.3 Target Pengguna
| Persona | Kebutuhan |
|---|---|
| Owner UMKM | Melihat status piutang, mengelola data invoice/customer, menerima ringkasan harian, bisa override/hentikan reminder tertentu |
| (Fase lanjut) Customer | Menerima pesan follow-up otomatis lewat Telegram/WhatsApp |

### 1.4 Ruang Lingkup Fase Sekarang: Dashboard (Frontend + Backend)
Ini fase yang sedang dikerjakan — **berdiri sendiri, belum tersambung ke Hermes**. Tujuannya: dashboard dinamis yang jadi *single source of truth* data invoice & customer, dengan API yang didesain generic supaya nanti Hermes tinggal jadi consumer tambahan.

**Fitur wajib (MVP dashboard):**
1. CRUD data customer (nama, kontak Telegram/WA, catatan perilaku bayar)
2. CRUD data invoice (jumlah, tanggal terbit, jatuh tempo, status: `belum_bayar` / `lunas` / `terlambat`)
3. List & filter invoice berdasarkan status
4. Update status invoice (tandai lunas manual)
5. Log follow-up (riwayat siapa yang sudah/pernah ditagih — meski pengirimannya nanti manual dulu sebelum Hermes tersambung)
6. Autentikasi owner (login dashboard)
7. Tampilan ringkasan (jumlah tertagih, belum, terlambat)

**Di luar scope fase ini:**
- Pengiriman pesan otomatis (baru aktif setelah Hermes tersambung)
- Reasoning/personalisasi nada pesan (itu kerjaan Hermes, bukan dashboard)
- Payment gateway otomatis
- Multi-channel

### 1.5 Requirement Non-Fungsional
| Aspek | Requirement |
|---|---|
| Performa | API response < 300ms untuk operasi CRUD standar |
| Resource | Total pemakaian RAM (Go + Postgres + Next.js) harus muat nyaman di 4GB, sisakan headroom untuk Hermes nanti |
| Keamanan | Password di-hash (argon2/bcrypt), API pakai auth token/session, tidak ada secret hardcoded |
| Skalabilitas auth | Middleware auth harus mendukung dua mode: session (dashboard/browser) dan service-token (nanti dipanggil Hermes) |
| Konsistensi API | Semua response JSON pakai struktur & penamaan status yang stabil, karena nanti akan diparse oleh Hermes untuk reasoning |
| Observability | Setiap perubahan status invoice tercatat sebagai log (siapa/apa yang mengubah, kapan) |

### 1.6 Arsitektur Sistem (Fase Dashboard)
```
[Next.js Frontend] ---HTTP/JSON---> [Go Backend API] ---SQL---> [PostgreSQL]
                                            |
                                   (nanti, fase lanjut)
                                            |
                                     [Hermes Agent] --- panggil endpoint yang sama pakai service-token
```

### 1.7 Skema Data (disederhanakan)
**customers**
- id, nama, kontak_telegram, catatan_perilaku_bayar, created_at

**invoices**
- id, customer_id (FK), jumlah, tanggal_terbit, jatuh_tempo, status (enum), created_at, updated_at

**follow_up_logs**
- id, invoice_id (FK), tanggal_kirim, isi_pesan, sumber (`manual` / `hermes`), respon_customer (nullable)

**users** (owner login dashboard)
- id, email, password_hash, created_at

### 1.8 Kontrak API (inti, dipakai dashboard *dan* nanti Hermes)
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/auth/login` | Login owner (session) |
| GET | `/customers` | List customer |
| POST | `/customers` | Tambah customer |
| GET | `/invoices?status=` | List invoice, filter opsional by status |
| POST | `/invoices` | Tambah invoice |
| PATCH | `/invoices/:id/status` | Update status invoice |
| GET | `/invoices/due-today` | Invoice jatuh tempo/terlambat (endpoint ini yang nanti dipanggil Hermes tiap hari) |
| POST | `/follow-up-logs` | Catat log follow-up (dipanggil dashboard manual sekarang, dipanggil Hermes nanti) |
| GET | `/summary/daily` | Ringkasan harian (tertagih/belum/terlambat) |

### 1.9 Metrik Keberhasilan (Fase Dashboard)
- Owner bisa input & lihat seluruh data invoice/customer tanpa error.
- Filter status & ringkasan harian menampilkan angka yang akurat.
- API bisa dipanggil secara terpisah dari UI (dites lewat curl/Postman) — bukti bahwa nanti Hermes bisa connect tanpa hambatan.
- Total RAM terpakai saat semua service jalan bareng masih di bawah ambang aman (sisakan minimal ~1GB free untuk Hermes nanti).

---

## BAGIAN 2 — EXECUTION PLAN

### Fase A — Dashboard (Sekarang Dikerjakan)

**Hari 1 — Fondasi backend & database**
- Setup project Go (Gin/Echo/Fiber) + struktur folder (routes, handlers, models)
- Setup PostgreSQL, buat migration untuk tabel `users`, `customers`, `invoices`, `follow_up_logs`
- Implementasi koneksi DB (sqlc/GORM) + konfigurasi `.env`
- Implementasi endpoint auth (`/auth/login`) dengan session/JWT

**Hari 2 — Core API & frontend dasar**
- Implementasi endpoint CRUD customer & invoice
- Implementasi endpoint `/invoices/due-today` dan `/summary/daily`
- Setup CORS di backend Go
- Setup project Next.js, halaman login, halaman list invoice & customer (connect ke API)

**Hari 3 — Fitur lengkap dashboard, testing, hardening**
- Halaman detail invoice + update status + catat follow-up log manual
- Halaman ringkasan harian di dashboard
- Uji seluruh alur end-to-end dengan data dummy
- Amankan API (rate limit dasar, validasi input, service-token placeholder untuk auth Hermes nanti)
- Cek pemakaian resource VPS saat semua service jalan bareng
- Deploy ke VPS (systemd/PM2 untuk proses yang perlu, atau serve Next.js sebagai build production)

### Fase B — Integrasi Hermes (Setelah Dashboard Stabil)

**Langkah 1 — Setup Hermes**
- Install/konfigurasi Hermes di VPS, hubungkan ke provider LLM API
- Setup gateway Telegram untuk kirim/terima pesan

**Langkah 2 — Hubungkan Hermes ke API dashboard**
- Buat service-token khusus untuk Hermes memanggil API Go
- Definisikan tool/skill di Hermes: panggil `/invoices/due-today`, susun pesan follow-up personal, kirim via Telegram, lalu `POST /follow-up-logs`

**Langkah 3 — Otomasi terjadwal**
- Setup cron/scheduled task di Hermes untuk trigger pengecekan harian
- Setup pengiriman ringkasan harian ke owner (ambil dari `/summary/daily`)

**Langkah 4 — Uji coba & demo**
- Simulasi siklus penuh: invoice jatuh tempo → Hermes deteksi → kirim reminder → owner terima ringkasan
- Siapkan skenario demo

### Risiko Utama & Mitigasi
| Risiko | Mitigasi |
|---|---|
| RAM mepet saat semua service (Next.js + Go + Postgres + Hermes) jalan bareng | Pantau `htop`/`free -h` dari Hari 1; pertimbangkan Next.js CSR-only bila SSR terlalu berat |
| Auth dashboard dan auth Hermes tercampur | Pisahkan middleware dari awal: session-based vs service-token-based |
| API berubah bentuk saat integrasi Hermes sehingga dashboard ikut rusak | Kunci kontrak API (bagian 1.8) sebagai acuan tetap; perubahan besar harus versioning endpoint |
| Data dummy tidak representatif saat testing | Siapkan minimal 5-10 data invoice dengan variasi status realistis sebelum fase integrasi |

---

*Dokumen ini adalah acuan kerja — detail teknis (contoh struktur folder Go, contoh migration SQL, atau contoh komponen Next.js) bisa dikembangkan sesuai kebutuhan saat eksekusi.*
