# UI/UX Design Spec — Dashboard Tagira

**Arah desain:** Ledger flat/bersih dengan selective skeuomorphic touches
**Alasan arah ini:** dashboard dipakai buat scan cepat harian (siapa telat bayar), bukan buat "dinikmati" secara visual — jadi mayoritas UI harus flat, jelas, dan cepat dibaca. Sentuhan skeuomorphic dipakai terbatas di 1-2 titik simbolik biar tetap distinctive tanpa mengorbankan kecepatan baca atau waktu development.

---

## 1. Prinsip Utama

1. **Scanability di atas segalanya.** Owner UMKM buka dashboard ini berkali-kali sehari buat cek cepat status piutang — bukan buat menikmati visual. Struktur tabel/list lebih diutamakan daripada kartu dekoratif.
2. **Spend boldness di satu tempat.** Hanya 1-2 elemen yang "berani" (nominal terlambat, stempel lunas) — sisanya tenang dan disiplin.
3. **Vernacular buku kas/nota**, bukan dashboard fintech korporat generik. Ini alat kerja personal buat UMKM, bukan tools growth-metrics ala startup.
4. **Bahasa manusia, bukan bahasa sistem.** "Sudah 5 hari telat" bukan "Status: OVERDUE". "Simpan" bukan "Submit".
5. **Minim animasi.** Hanya transisi halus saat status berubah jadi lunas — bukan hover effect atau fade-in di semua elemen.
6. **Light mode sebagai default** — konteks pemakaian siang hari, asosiasi ke buku kas fisik.

---

## 2. Warna

| Token | Hex | Pemakaian |
|---|---|---|
| `bg-base` | `#FAF9F6` | Latar utama, off-white — bukan cream hangat generik |
| `ink` | `#1C1B19` | Teks utama, hampir hitam (warna tinta pena, bukan #0B0B0B generik) |
| `accent-stamp` | `#8A6D3B` | Aksen coklat "stempel/cap" — dipakai sangat terbatas (elemen stempel lunas, garis aksen kecil) |
| `status-overdue` | `#B23A3A` | Merah muted untuk status terlambat — dipakai di teks, bukan background/badge |
| `status-paid` | `#3D6B4F` | Hijau muted untuk status lunas — dipakai di teks, bukan background/badge |
| `border-hairline` | `#DDD8CC` | Garis pembatas tabel/section, tipis (1px), bukan shadow lembut |

**Dihindari secara sengaja:** cream + terracotta (#D97757), dark mode dengan aksen neon, gradient dekoratif, badge pill berwarna-warni, shadow lembut generik di semua elemen.

---

## 3. Tipografi

| Peran | Font | Catatan |
|---|---|---|
| Nominal/angka besar (ringkasan harian, total piutang) | Serif tegas (contoh: **Fraunces** atau **Source Serif 4**) | Dipakai khusus untuk angka nominal, elemen paling penting secara visual di dunia nota |
| UI/label/body/tabel | Sans netral (contoh: **Inter** atau **IBM Plex Sans**) | Dipakai untuk semua teks fungsional |

**Aturan:**
- Label pakai sentence case, **bukan ALL CAPS**.
- Tidak ada eyebrow label di atas tiap section.
- Line length tabel/form tetap ringkas, tidak melebar penuh layar di desktop.

---

## 4. Layout

### Struktur utama: tabel/list, bukan kartu
```
+--------------------------------------------------+
| Tagira                              [Owner Name]  |
+--------------------------------------------------+
| Ringkasan Hari Ini                                |
|  Rp 4.250.000 belum tertagih   (angka besar, merah)|
|  3 invoice jatuh tempo hari ini                    |
+--------------------------------------------------+
| Daftar Invoice                    [+ Tambah]       |
|--------------------------------------------------|
| Customer      Nominal      Jatuh tempo   Status    |
|--------------------------------------------------|
| Budi S.       Rp 500.000   3 hari lalu   Telat     |
| Sari W.       Rp 1.200.000 Hari ini      Jatuh tempo|
| Andi P.       Rp 750.000   -             Lunas ✓   |
+--------------------------------------------------+
```
- Baris tabel dipisah garis hairline tipis (`border-hairline`), bukan shadow card.
- Status ditulis sebagai teks berwarna (`status-overdue` / `status-paid`), bukan badge pill.
- Kolom nominal rata kanan, pakai font serif untuk angka.

### Alignment
- Konten utama left-aligned (tabel, form).
- Angka ringkasan (nominal besar) bisa center-aligned di kartu ringkasan kecil di atas tabel — satu-satunya elemen yang boleh "menonjol".

---

## 5. Komponen Kunci

### 5.1 Ringkasan Harian
- Nominal total terlambat: font serif besar (ukuran ~32-40px), warna `status-overdue`.
- Teks pendukung di bawahnya: sans, ukuran kecil, warna `ink` dengan opacity lebih rendah.
- Tidak ada gradient/background berwarna — cukup `bg-base` polos dengan border hairline tipis di bawah section.

### 5.2 Tabel Daftar Invoice
- Header kolom: sans, sentence case, warna `ink` dengan opacity ~70%.
- Baris: hover state minimal (perubahan warna background sangat halus, bukan shadow/scale).
- Status kolom: teks warna sesuai token (merah/hijau/netral), tanpa background badge.
- Klik baris → buka detail invoice (bukan tombol terpisah di tiap baris kalau memungkinkan, biar tabel tetap bersih).

### 5.3 Stempel "Lunas" (satu-satunya elemen skeuomorphic)
- Elemen kecil berbentuk lingkaran/oval sederhana, warna `accent-stamp`, dengan sedikit rotasi (misal -8deg) dan border sedikit tidak sempurna (efek "dicap manual") — dieksekusi simpel, cukup border + rotate + font condensed, tidak perlu tekstur foto asli.
- Muncul di detail invoice saat status diubah jadi lunas, dengan transisi fade-in singkat (200-300ms).
- Dipakai konsisten sebagai satu-satunya "kejutan visual" di seluruh dashboard.

### 5.4 Garis Perforasi (aksen skeuomorphic kedua, opsional)
- Garis putus-putus tipis (`border-hairline`, dashed) untuk memisahkan section ringkasan harian dari tabel invoice — mengingatkan pada garis sobekan kwitansi, tanpa perlu tekstur berat.

### 5.5 Form (Tambah/Edit Invoice & Customer)
- Input field flat, border hairline, tanpa shadow.
- Label sentence case di atas input, bukan placeholder-only.
- Tombol aksi: teks aktif sesuai fungsi ("Simpan invoice", bukan "Submit"; "Tandai lunas", bukan "Update status").

---

## 6. Copywriting

| Konteks | Jangan | Pakai |
|---|---|---|
| Status invoice | "OVERDUE" | "Telat 5 hari" |
| Status invoice | "PENDING" | "Jatuh tempo hari ini" / "Jatuh tempo 3 hari lagi" |
| Tombol simpan | "Submit" | "Simpan invoice" |
| Tombol update status | "Update" | "Tandai lunas" |
| Empty state (belum ada invoice) | "No data available" | "Belum ada invoice — tambah invoice pertama kamu" |
| Error form | "Invalid input" | Jelaskan spesifik: "Nominal harus diisi" |

Toast konfirmasi memakai kata kerja yang sama dengan tombol: tombol "Tandai lunas" → toast "Ditandai lunas".

---

## 7. Yang Sengaja Dihindari (checklist anti-AI-slop)

- [ ] Cream background + serif display + aksen terracotta (#D97757)
- [ ] Dark mode dengan aksen neon/vermilion
- [ ] Kartu rounded seragam dengan shadow lembut yang sama di semua elemen
- [ ] Badge pill berwarna-warni untuk status
- [ ] Eyebrow label ALL CAPS di atas setiap section
- [ ] Label dengan em dash ("Invoice — Detail") atau middle dot ("A · B · C")
- [ ] Font monospace untuk label data
- [ ] Tanda panah "→" di akhir teks tombol/link
- [ ] Fade-in scroll di setiap section, hover transition di semua kartu
- [ ] Skeuomorphic penuh di seluruh UI (tekstur berat, multi-layer shadow di semua elemen)

---

*Dokumen ini adalah acuan visual untuk implementasi Next.js/Tailwind — token warna & tipografi di atas bisa langsung dipetakan ke `tailwind.config` (custom colors + font families).*
