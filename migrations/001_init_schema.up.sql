-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    kontak_telegram VARCHAR(255),
    catatan_perilaku_bayar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    jumlah BIGINT NOT NULL,
    tanggal_terbit DATE NOT NULL,
    jatuh_tempo DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'belum_bayar' CHECK (status IN ('belum_bayar','lunas','terlambat')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create follow_up_logs table
CREATE TABLE follow_up_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    tanggal_kirim TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    isi_pesan TEXT NOT NULL,
    sumber VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (sumber IN ('manual','hermes')),
    respon_customer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_jatuh_tempo ON invoices(jatuh_tempo);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_followup_invoice_id ON follow_up_logs(invoice_id);
CREATE INDEX idx_followup_tanggal_kirim ON follow_up_logs(tanggal_kirim);