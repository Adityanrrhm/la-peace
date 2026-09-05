-- =============================================================
-- TAGIRA — DUMMY SEED DATA
-- Jalankan SETELAH migration 001_init_schema.up.sql
-- Berisi: 1 user, 6 customer, 12 invoice, 5 follow-up log
--
-- Login dashboard:
--   Email    : owner@tagira.dev
--   Password : tagira123
--   (bcrypt hash dari "tagira123", cost 12)
-- =============================================================

-- ──────────────────────────────────────────
-- 1. USER OWNER
-- ──────────────────────────────────────────
INSERT INTO users (id, email, password_hash, created_at) VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'owner@tagira.dev',
  '$2a$10$lOIAjW4x2P7UbF3.HlJQa.SMuyXvvcxSJma3rfiZeQDBhzNu3s4Ja',
  NOW() - INTERVAL '30 days'
);

-- ──────────────────────────────────────────
-- 2. CUSTOMERS (6 customer UMKM realistis)
-- ──────────────────────────────────────────
INSERT INTO customers (id, nama, kontak_telegram, catatan_perilaku_bayar, created_at) VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'Budi Santoso',
    '@budisantoso',
    'Biasanya bayar H+3 setelah ditagih. Responsif di Telegram.',
    NOW() - INTERVAL '25 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'Sari Wulandari',
    '@sariwulan',
    'Sering minta perpanjangan. Bayar kalau sudah ditagih 2x.',
    NOW() - INTERVAL '20 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'Andi Prasetyo',
    '@andipras',
    'Customer lama, bayar tepat waktu, jarang perlu diingatkan.',
    NOW() - INTERVAL '18 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    'Dewi Rahayu',
    '@dewirah',
    'Baru pertama order. Belum ada riwayat bayar.',
    NOW() - INTERVAL '10 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    'Riko Firmansyah',
    '@rikofirman',
    'Pernah telat 2 minggu di invoice sebelumnya. Perlu follow-up lebih awal.',
    NOW() - INTERVAL '15 days'
  ),
  (
    'c1000000-0000-0000-0000-000000000006',
    'Lestari Ningrum',
    '@lestari_n',
    'Bayar cash setelah barang diterima. Selalu tepat waktu.',
    NOW() - INTERVAL '22 days'
  );

-- ──────────────────────────────────────────
-- 3. INVOICES (12 invoice, variasi status)
-- Prefix UUID pakai 'e1' (huruf hex valid)
-- ──────────────────────────────────────────
INSERT INTO invoices (id, customer_id, jumlah, tanggal_terbit, jatuh_tempo, status, created_at, updated_at) VALUES

  -- Budi Santoso: 1 terlambat, 1 lunas
  (
    'e1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    1500000,
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE - INTERVAL '10 days',
    'terlambat',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '11 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    800000,
    CURRENT_DATE - INTERVAL '35 days',
    CURRENT_DATE - INTERVAL '25 days',
    'lunas',
    NOW() - INTERVAL '35 days',
    NOW() - INTERVAL '23 days'
  ),

  -- Sari Wulandari: 2 terlambat, 1 belum bayar, 1 lunas
  (
    'e1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000002',
    2750000,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '15 days',
    'terlambat',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '16 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000002',
    1200000,
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '45 days',
    'lunas',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '40 days'
  ),

  -- Andi Prasetyo: 1 lunas, 1 belum bayar (belum jatuh tempo)
  (
    'e1000000-0000-0000-0000-000000000005',
    'c1000000-0000-0000-0000-000000000003',
    3500000,
    CURRENT_DATE - INTERVAL '40 days',
    CURRENT_DATE - INTERVAL '25 days',
    'lunas',
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '24 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000006',
    'c1000000-0000-0000-0000-000000000003',
    950000,
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '5 days',
    'belum_bayar',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),

  -- Dewi Rahayu: jatuh tempo HARI INI
  (
    'e1000000-0000-0000-0000-000000000007',
    'c1000000-0000-0000-0000-000000000004',
    600000,
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE,
    'belum_bayar',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),

  -- Riko Firmansyah: 1 terlambat parah, 1 belum bayar
  (
    'e1000000-0000-0000-0000-000000000008',
    'c1000000-0000-0000-0000-000000000005',
    4250000,
    CURRENT_DATE - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '30 days',
    'terlambat',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '31 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000009',
    'c1000000-0000-0000-0000-000000000005',
    1750000,
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '4 days',
    'belum_bayar',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),

  -- Lestari Ningrum: 2 lunas
  (
    'e1000000-0000-0000-0000-000000000010',
    'c1000000-0000-0000-0000-000000000006',
    2100000,
    CURRENT_DATE - INTERVAL '50 days',
    CURRENT_DATE - INTERVAL '35 days',
    'lunas',
    NOW() - INTERVAL '50 days',
    NOW() - INTERVAL '34 days'
  ),
  (
    'e1000000-0000-0000-0000-000000000011',
    'c1000000-0000-0000-0000-000000000006',
    1350000,
    CURRENT_DATE - INTERVAL '25 days',
    CURRENT_DATE - INTERVAL '10 days',
    'lunas',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '9 days'
  ),

  -- Sari Wulandari: 1 belum bayar baru
  (
    'e1000000-0000-0000-0000-000000000012',
    'c1000000-0000-0000-0000-000000000002',
    500000,
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '9 days',
    'belum_bayar',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  );

-- ──────────────────────────────────────────
-- 4. FOLLOW-UP LOGS (5 log manual)
-- Prefix UUID pakai 'f' (hex valid)
-- ──────────────────────────────────────────
INSERT INTO follow_up_logs (id, invoice_id, tanggal_kirim, isi_pesan, sumber, respon_customer, created_at) VALUES
  (
    'f1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '8 days',
    'Halo Pak Budi, mengingatkan bahwa invoice Rp 1.500.000 sudah jatuh tempo 2 hari lalu. Mohon konfirmasi pembayarannya ya, terima kasih.',
    'manual',
    'Iya mba, besok saya transfer.',
    NOW() - INTERVAL '8 days'
  ),
  (
    'f1000000-0000-0000-0000-000000000002',
    'e1000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '5 days',
    'Pak Budi, belum ada konfirmasi transfer untuk invoice Rp 1.500.000. Sudah 5 hari dari jatuh tempo. Mohon segera ya.',
    'manual',
    NULL,
    NOW() - INTERVAL '5 days'
  ),
  (
    'f1000000-0000-0000-0000-000000000003',
    'e1000000-0000-0000-0000-000000000003',
    NOW() - INTERVAL '12 days',
    'Halo Mbak Sari, invoice Rp 2.750.000 sudah jatuh tempo 3 hari lalu. Apakah ada kendala? Boleh kami bantu?',
    'manual',
    'Maaf mba, lagi nunggu transfer dari klien saya. Bisa minta waktu seminggu lagi?',
    NOW() - INTERVAL '12 days'
  ),
  (
    'f1000000-0000-0000-0000-000000000004',
    'e1000000-0000-0000-0000-000000000003',
    NOW() - INTERVAL '5 days',
    'Mbak Sari, sudah seminggu sejak perpanjangan. Invoice Rp 2.750.000 belum masuk. Mohon konfirmasinya.',
    'manual',
    NULL,
    NOW() - INTERVAL '5 days'
  ),
  (
    'f1000000-0000-0000-0000-000000000005',
    'e1000000-0000-0000-0000-000000000008',
    NOW() - INTERVAL '20 days',
    'Halo Pak Riko, invoice Rp 4.250.000 sudah melewati jatuh tempo 10 hari lalu. Mohon segera dilunasi atau hubungi kami untuk diskusi.',
    'manual',
    'Siap, minggu depan pasti saya lunasi.',
    NOW() - INTERVAL '20 days'
  );

-- ──────────────────────────────────────────
-- SUMMARY RINGKAS
-- ──────────────────────────────────────────
-- Users    : 1 (owner@tagira.dev / tagira123)
-- Customer : 6
-- Invoice  : 12
--   terlambat  : 3 (Budi #1, Sari #3, Riko #8)
--   belum_bayar: 4 (Andi #6, Dewi #7 [hari ini], Riko #9, Sari #12)
--   lunas      : 5 (Budi #2, Sari #4, Andi #5, Lestari #10, #11)
-- Follow-up : 5 (sumber 'manual')
-- =============================================================
