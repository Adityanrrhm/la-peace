'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Button, Card, CardContent, CardHeader, Label, Stempel, TableHeader } from '@/components/ui';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { formatCurrency, formatDateShort, getStatusLabel, getStatusColor } from '@/lib/utils';
import Link from 'next/link';
import { useInvoices, useDailySummary } from '@/hooks/useApi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { SortDirection } from '@/types/api';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse URL params
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sort_by') || '';
  const sortDir = (searchParams.get('sort_dir') as SortDirection) || 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({
    page,
    page_size: pageSize,
    status: status || undefined,
    sort_by: sortBy || undefined,
    sort_dir: sortDir,
  });
  const { data: summary, isLoading: summaryLoading } = useDailySummary();

  const invoices = invoicesData?.data?.invoices ?? [];
  const totalPages = invoicesData?.meta?.total_pages ?? 1;
  const currentPage = invoicesData?.meta?.page ?? 1;
  const totalItems = invoicesData?.meta?.total_items ?? 0;

  // URL sync helpers
  const updateFilters = useCallback((newParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    // Reset to page 1 when filters change (except explicit page change)
    if (newParams.page === undefined) {
      params.set('page', '1');
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      updateFilters({ sort_dir: sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      updateFilters({ sort_by: field, sort_dir: 'desc' });
    }
  }, [sortBy, sortDir, updateFilters]);

  const handlePageChange = useCallback((newPage: number) => {
    updateFilters({ page: newPage });
  }, [updateFilters]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    updateFilters({ page_size: newSize, page: 1 });
  }, [updateFilters]);

  const handleStatusChange = useCallback((newStatus: string) => {
    updateFilters({ status: newStatus });
  }, [updateFilters]);

  const handleResetFilters = useCallback(() => {
    router.push('/', { scroll: false });
  }, [router]);

  const hasActiveFilters = status || sortBy || pageSize !== 20;

  return (
    <DashboardLayout>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Ringkasan Harian */}
        <section className="mb-6" aria-labelledby="ringkasan-heading">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Belum Tertagih - Hero */}
                <div className="lg:col-span-2 border-r border-border-hairline lg:border-r-0 lg:border-b sm:pr-6 lg:pr-0 lg:pb-6">
                  <p className="text-sm text-ink/60 mb-1">Total belum tertagih</p>
                  <p className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-status-overdue">
                    {summary ? formatCurrency(summary.total_belum) : 'Rp 0'}
                  </p>
                  <p className="text-sm text-ink/50 mt-1">
                    {summary?.belum_tagih ?? 0} invoice jatuh tempo hari ini / terlambat
                  </p>
                </div>

                {/* Tertagih */}
                <div className="border-r border-border-hairline lg:border-r-0 lg:border-b sm:px-4 lg:px-0 lg:py-4 lg:first:pt-0">
                  <p className="text-sm text-ink/60 mb-1">Sudah ditagih hari ini</p>
                  <p className="font-serif text-2xl font-bold text-ink">{summary?.tertangih ?? 0}</p>
                  <p className="text-xs text-ink/50">invoice</p>
                </div>

                {/* Lunas */}
                <div className="sm:px-4 lg:px-0 lg:py-4 lg:first:pt-0">
                  <p className="text-sm text-ink/60 mb-1">Lunas</p>
                  <p className="font-serif text-2xl font-bold text-status-paid">{summary?.lunas ?? 0}</p>
                  <p className="text-xs text-ink/50">invoice</p>
                </div>
              </div>

              {/* Garis Perforasi - skeuomorphic accent */}
              <div className="my-4 border-t border-dashed border-border-hairline" aria-hidden="true" />

              {/* Status counts row */}
              <div className="flex flex-wrap gap-4 text-sm text-ink/70">
                <span className="font-medium">Terlambat: <span className="text-status-overdue font-semibold">{summary?.terlambat ?? 0}</span></span>
                <span className="font-medium">Belum bayar: <span className="text-ink/70 font-semibold">{summary?.belum_bayar ?? 0}</span></span>
                <span className="font-medium">Lunas: <span className="text-status-paid font-semibold">{summary?.lunas ?? 0}</span></span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Daftar Invoice */}
        <section aria-labelledby="daftar-invoice-heading">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <h2 id="daftar-invoice-heading" className="font-serif text-lg font-semibold text-ink">Daftar Invoice</h2>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Reset filter
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/invoices/new">
                <Button size="sm">+ Tambah Invoice</Button>
              </Link>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-auto min-w-[160px]" aria-label="Filter status">
                  <SelectValue>
                    {() => {
                      const labels: Record<string, string> = {
                        "": "Semua Status",
                        belum_bayar: "Belum Bayar",
                        lunas: "Lunas",
                        terlambat: "Terlambat",
                      };
                      return labels[status] ?? "Semua Status";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                  <SelectItem value="lunas">Lunas</SelectItem>
                  <SelectItem value="terlambat">Terlambat</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={(v) => handlePageSizeChange(parseInt(v, 10))}>
                <SelectTrigger className="w-auto min-w-[100px]" aria-label="Item per halaman">
                  <SelectValue>
                    {() => `${pageSize} per halaman`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per halaman</SelectItem>
                  <SelectItem value="20">20 per halaman</SelectItem>
                  <SelectItem value="50">50 per halaman</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card variant="table">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed rounded-table" role="table">
                <thead>
                  <tr className="bg-white/50 dark:bg-ink/5">
                    <TableHeader sortBy="customer_name" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} align="left">
                      Customer
                    </TableHeader>
                    <TableHeader sortBy="jumlah" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} align="right">
                      Nominal
                    </TableHeader>
                    <TableHeader sortBy="jatuh_tempo" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} align="left">
                      Jatuh tempo
                    </TableHeader>
                    <TableHeader sortBy="status" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} align="left">
                      Status
                    </TableHeader>
                    <th className="px-4 py-3 text-left font-sans font-medium text-ink/70"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-ink/50">
                        Memuat invoice...
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-ink/50">
                        Belum ada invoice — <Link href="/invoices/new" className="text-accent-stamp hover:underline">tambah invoice pertama kamu</Link>
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="hover:bg-ink/[0.02] transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/invoices/${invoice.id}`}
                      >
                        <td className="px-4 py-3 font-medium text-ink">{invoice.customer_name}</td>
                        <td className="px-4 py-3 text-right font-serif text-ink">{formatCurrency(invoice.jumlah)}</td>
                        <td className="px-4 py-3 text-ink/70">
                          {invoice.jatuh_tempo ? formatDateShort(invoice.jatuh_tempo) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={getStatusColor(invoice.status)}>
                            {getStatusLabel(invoice.status, invoice.jatuh_tempo)}
                          </span>
                          {invoice.status === 'lunas' && <Stempel />}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="text-sm text-accent-stamp hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Info */}
            <div className="mt-4 px-4 py-3 border border-border-hairline rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-ink/60">
                Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} dari {totalItems} invoice
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-ink/70 px-2">
                  Halaman {currentPage} dari {totalPages || 1}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </DashboardLayout>
  );
}
