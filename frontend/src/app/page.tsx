'use client';

import { useAuth } from '@/context/AuthContext';
import { Button, Card, CardContent, CardHeader, Label, Stempel } from '@/components/ui';
import { formatCurrency, formatDateShort, getStatusLabel, getStatusColor, getDaysUntilDue } from '@/lib/utils';
import Link from 'next/link';
import { useInvoices, useDailySummary } from '@/hooks/useApi';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({ page: 1, page_size: 10 });
  const { data: summary, isLoading: summaryLoading } = useDailySummary();

  const invoices = invoicesData?.data?.invoices ?? [];
  const totalPages = invoicesData?.meta?.total_pages ?? 1;
  const currentPage = invoicesData?.meta?.page ?? 1;

  const statusCounts = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <header className="border-b border-border-hairline bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-xl font-bold text-ink">Tagira</h1>
            <span className="hidden sm:inline text-sm text-ink/50">Dashboard Piutang</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink/70 hidden md:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>Keluar</Button>
          </div>
        </div>
      </header>

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
                <span className="font-medium">Terlambat: <span className="text-status-overdue font-semibold">{statusCounts.terlambat ?? 0}</span></span>
                <span className="font-medium">Belum bayar: <span className="text-ink/70 font-semibold">{statusCounts.belum_bayar ?? 0}</span></span>
                <span className="font-medium">Lunas: <span className="text-status-paid font-semibold">{statusCounts.lunas ?? 0}</span></span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Daftar Invoice */}
        <section aria-labelledby="daftar-invoice-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="daftar-invoice-heading" className="font-serif text-lg font-semibold text-ink">Daftar Invoice</h2>
            <Link href="/invoices/new">
              <Button size="sm">+ Tambah Invoice</Button>
            </Link>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-border-hairline bg-white/50">
                    <th className="px-4 py-3 text-left font-sans font-medium text-ink/70">Customer</th>
                    <th className="px-4 py-3 text-right font-sans font-medium text-ink/70">Nominal</th>
                    <th className="px-4 py-3 text-left font-sans font-medium text-ink/70">Jatuh tempo</th>
                    <th className="px-4 py-3 text-left font-sans font-medium text-ink/70">Status</th>
                    <th className="px-4 py-3 text-left font-sans font-medium text-ink/70 w-32"></th>
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
                        className="border-b border-border-hairline hover:bg-ink/[0.02] transition-colors cursor-pointer"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border-hairline flex items-center justify-between">
                <p className="text-sm text-ink/60">
                  Halaman {currentPage} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => window.location.search = `?page=${currentPage - 1}`}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => window.location.search = `?page=${currentPage + 1}`}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}