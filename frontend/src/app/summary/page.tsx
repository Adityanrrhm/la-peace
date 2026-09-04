'use client';

import { useAuth } from '@/context/AuthContext';
import { Button, Card, CardContent, CardHeader, Stempel } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useDailySummary } from '@/hooks/useApi';

export default function SummaryPage() {
  const { user, logout } = useAuth();
  const { data: summary, isLoading, error, refetch } = useDailySummary();

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="border-b border-border-hairline bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-accent-stamp hover:underline text-sm">
              ← Kembali ke Dashboard
            </Link>
            <h1 className="font-serif text-xl font-bold text-ink">Ringkasan Harian</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink/70 hidden md:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Refresh</Button>
            <Button variant="ghost" size="sm" onClick={logout}>Keluar</Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 text-sm text-status-overdue bg-status-overdue/10 border border-status-overdue/20 rounded" role="alert">
            Gagal memuat ringkasan: {error instanceof Error ? error.message : 'Kesalahan tidak diketahui'}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Total Belum Tertagih - Hero */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm text-ink/60 mb-1">Total belum tertagih</p>
              <p className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-status-overdue">
                {summary ? formatCurrency(summary.total_belum) : isLoading ? 'Memuat...' : 'Rp 0'}
              </p>
              <p className="text-sm text-ink/50 mt-1">
                {summary?.belum_tagih ?? 0} invoice jatuh tempo hari ini / terlambat
              </p>
            </CardContent>
          </Card>

          {/* Tertagih */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm text-ink/60 mb-1">Sudah ditagih hari ini</p>
              <p className="font-serif text-2xl font-bold text-ink">{summary?.tertangih ?? 0}</p>
              <p className="text-xs text-ink/50">invoice</p>
            </CardContent>
          </Card>

          {/* Lunas */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm text-ink/60 mb-1">Lunas</p>
              <p className="font-serif text-2xl font-bold text-status-paid">{summary?.lunas ?? 0}</p>
              <p className="text-xs text-ink/50">invoice</p>
            </CardContent>
          </Card>
        </div>

        {/* Garis Perforasi */}
        <div className="my-6 border-t border-dashed border-border-hairline" aria-hidden="true" />

        {/* Detail Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-serif text-base font-semibold text-ink">Terlambat</h3>
            </CardHeader>
            <CardContent>
              <p className="font-serif text-3xl font-bold text-status-overdue">
                {summary?.terlambat ?? 0}
              </p>
              <p className="text-sm text-ink/50 mt-1">invoice</p>
              <p className="font-serif text-lg font-bold text-status-overdue mt-2">
                {summary ? formatCurrency(summary.total_terlambat) : 'Rp 0'}
              </p>
              <p className="text-xs text-ink/50">total nominal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-serif text-base font-semibold text-ink">Belum Bayar</h3>
            </CardHeader>
            <CardContent>
              <p className="font-serif text-3xl font-bold text-ink/70">
                {summary?.belum_tagih ?? 0}
              </p>
              <p className="text-sm text-ink/50 mt-1">invoice</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-serif text-base font-semibold text-ink">Lunas</h3>
            </CardHeader>
            <CardContent>
              <p className="font-serif text-3xl font-bold text-status-paid">
                {summary?.lunas ?? 0}
              </p>
              <p className="text-sm text-ink/50 mt-1">invoice</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-serif text-base font-semibold text-ink">Total Semua Invoice</h3>
            </CardHeader>
            <CardContent>
              <p className="font-serif text-3xl font-bold text-ink">
                {summary ? formatCurrency(summary.total_jumlah) : 'Rp 0'}
              </p>
              <p className="text-sm text-ink/50 mt-1">total nominal</p>
            </CardContent>
          </Card>
        </div>

        {/* Action */}
        <div className="mt-8 flex justify-end">
          <Link href="/">
            <Button variant="secondary">Kembali ke Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}