// API Types - Mirror backend DTOs

export type SortDirection = 'asc' | 'desc';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  error: null;
  meta: null;
}

export interface MeResponse {
  success: boolean;
  data: {
    user_id: string;
    email: string;
    auth_mode: 'session' | 'service_token';
  };
  error: null;
  meta: null;
}

export interface Customer {
  id: string;
  nama: string;
  kontak_telegram: string;
  catatan_perilaku_bayar: string;
  created_at: string;
}

export interface CreateCustomerRequest {
  nama: string;
  kontak_telegram?: string;
  catatan_perilaku_bayar?: string;
}

export interface UpdateCustomerRequest {
  nama?: string;
  kontak_telegram?: string;
  catatan_perilaku_bayar?: string;
}

export interface CustomerListResponse {
  success: boolean;
  data: {
    customers: Customer[];
  };
  error: null;
  meta: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface CustomerResponse {
  success: boolean;
  data: Customer;
  error: null;
  meta: null;
}

export interface Invoice {
  id: string;
  customer_id: string;
  customer_name: string;
  jumlah: number;
  tanggal_terbit: string;
  jatuh_tempo: string;
  status: 'belum_bayar' | 'lunas' | 'terlambat';
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceRequest {
  customer_id: string;
  jumlah: number;
  tanggal_terbit: string;
  jatuh_tempo: string;
}

export interface UpdateInvoiceStatusRequest {
  status: 'belum_bayar' | 'lunas' | 'terlambat';
}

export interface InvoiceListResponse {
  success: boolean;
  data: {
    invoices: Invoice[];
  };
  error: null;
  meta: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface InvoiceResponse {
  success: boolean;
  data: Invoice;
  error: null;
  meta: null;
}

export interface DueTodayInvoiceResponse {
  success: boolean;
  data: Invoice[];
  error: null;
  meta: null;
}

export interface FollowUpLog {
  id: string;
  invoice_id: string;
  invoice_customer: string;
  tanggal_kirim: string;
  isi_pesan: string;
  sumber: 'manual' | 'hermes';
  respon_customer: string;
  created_at: string;
}

export interface CreateFollowUpLogRequest {
  invoice_id: string;
  isi_pesan: string;
  sumber: 'manual' | 'hermes';
  respon_customer?: string;
}

export interface FollowUpLogListResponse {
  success: boolean;
  data: {
    logs: FollowUpLog[];
  };
  error: null;
  meta: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface FollowUpLogResponse {
  success: boolean;
  data: FollowUpLog;
  error: null;
  meta: null;
}

export interface DailySummaryResponse {
  success: boolean;
  data: {
    tertangih: number;
    belum_tagih: number;
    terlambat: number;
    lunas: number;
    total_jumlah: number;
    total_belum: number;
    total_terlambat: number;
  };
  error: null;
  meta: null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error: ApiError | null;
  meta?: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}