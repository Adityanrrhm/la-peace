'use client';

import { Button, Card, CardContent, CardHeader, Stempel } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useDailySummary } from '@/hooks/useApi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function SummaryPage() {
  const { data: summary, isLoading, error, refetch } = useDailySummary();

  return (
    <DashboardLayout>
      <main className="px-4 py-6">
        {error && (
          <div className="mb-6 p-4 text-sm text-status-overdue bg-status-overdue/10 border border-status-overdue/20 rounded" role="alert">
            Gagal memuat ringkasan: {error instanceof Error ? error.message : 'Kesalahan tidak diketahui'}
          </div>
        )}

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Belum Tertagih - Hero */}
              <div className="lg:col-span-2 border-r border-border-hairline lg:border-r-0 lg:border-b sm:pr-6 lg:pr-0 lg:pb-6">
                <p className="text-sm text-ink/60 mb-1">Total belum tertagih</p>
                {isLoading ? (
                  <Skeleton className="h-10 w-48 mb-1" />
                ) : (
                  <p className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-status-overdue">
                    {formatCurrency(summary.total_belum)}
                  </p>
                )}
                <p className="text-sm text-ink/50 mt-1">
                  {summary?.belum_tagih ?? 0} invoice jatuh tempo hari ini / terlambat
                </p>
              </div>

              {/* Tertagih */}
              <div className="border-r border-border-hairline lg:border-r-0 lg:border-b sm:px-4 lg:px-0 lg:py-4 lg:first:pt-0">
                <p className="text-sm text-ink/60 mb-1">Sudah ditagih hari ini</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="font-serif text-2xl font-bold text-ink">{summary.tertangih}</p>
                )}
                <p className="text-xs text-ink/50">invoice</p>
              </div>

              {/* Lunas */}
              <div className="sm:px-4 lg:px-0 lg:py-4 lg:first:pt-0">
                <p className="text-sm text-ink/60 mb-1">Lunas</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="font-serif text-2xl font-bold text-status-paid">{summary.lunas}</p>
                )}
                <p className="text-xs text-ink/50">invoice</p>
              </div>
            </div>

            {/* Garis Perforasi */}
            <div className="my-4 border-t border-dashed border-border-hairline" aria-hidden="true" />

            {/* Status counts row */}
            <div className="flex flex-wrap gap-4 text-sm text-ink/70">
              <span className="font-medium">Terlambat: <span className="text-status-overdue font-semibold">{summary?.terlambat ?? 0}</span></span>
              <span className="font-medium">Belum bayar: <span className="text-ink/70 font-semibold">{summary?.belum_bayar ?? 0}</span></span>
              <span className="font-medium">Lunas: <span className="text-status-paid font-semibold">{summary?.lunas ?? 0}</span></span>
            </div>
          </CardContent>
        </Card>

        {/* Detail Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-serif text-base font-semibold text-ink">Terlambat</h3>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className="font-serif text-3xl font-bold text-status-overdue">
                  {summary.terlambat}
                </p>
              )}
              <p className="text-sm text-ink/50 mt-1">invoice</p>
              {isLoading ? (
                <Skeleton className="h-6 w-32 mt-2" />
              ) : (
                <p className="font-serif text-lg font-bold text-status-overdue mt-2">
                  {formatCurrency(summary.total_terlambat)}
                </p>
              )}
              <p className="text-xs text-ink/50">total nominal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-serif text-base font-semibold text-ink">Belum Bayar</h3>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className="font-serif text-3xl font-bold text-ink/70">
                  {summary.belum_tagih}
                </p>
              )}
              <p className="text-sm text-ink/50 mt-1">invoice</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-serif text-base font-semibold text-ink">Lunas</h3>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className="font-serif text-3xl font-bold text-status-paid">
                  {summary.lunas}
                </p>
              )}
              <p className="text-sm text-ink/50 mt-1">invoice</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-serif text-base font-semibold text-ink">Total Semua Invoice</h3>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32 mb-1" />
              ) : (
                <p className="font-serif text-3xl font-bold text-ink">
                  {formatCurrency(summary.total_jumlah)}
                </p>
              )}
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
    </DashboardLayout>
  );
}