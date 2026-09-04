'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useInvoice, useUpdateInvoiceStatus, useFollowUpLogsByInvoice, useCreateFollowUpLog } from '@/hooks/useApi';
import { formatCurrency, formatDateShort, getStatusLabel, getStatusColor } from '@/lib/utils';
import { Button, Card, CardContent, CardHeader, Label, Stempel, Textarea, ConfirmDialog } from '@/components/ui';

const followUpSchema = z.object({
  isi_pesan: z.string().min(1, 'Isi pesan harus diisi').max(1000, 'Maksimal 1000 karakter'),
});

type FollowUpFormData = z.infer<typeof followUpSchema>;

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [showConfirm, setShowConfirm] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const { data: invoice, isLoading: invoiceLoading, error: invoiceError, refetch: refetchInvoice } = useInvoice(id);
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useFollowUpLogsByInvoice(id);
  const updateStatus = useUpdateInvoiceStatus();
  const createFollowUp = useCreateFollowUpLog();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpSchema),
  });

  const handleMarkPaid = async () => {
    try {
      await updateStatus.mutateAsync({ id, status: 'lunas' });
      setShowConfirm(false);
      await refetchInvoice();
      await refetchLogs();
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleFollowUpSubmit = async (data: FollowUpFormData) => {
    setFollowUpError(null);
    try {
      await createFollowUp.mutateAsync({
        invoice_id: id,
        isi_pesan: data.isi_pesan,
        sumber: 'manual',
      });
      reset();
      await refetchLogs();
    } catch (err) {
      setFollowUpError(err instanceof Error ? err.message : 'Gagal menambahkan catatan follow-up');
    }
  };

  if (invoiceLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-pulse text-ink/50">Memuat invoice...</div>
      </div>
    );
  }

  if (invoiceError || !invoice) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="font-serif text-xl font-bold text-ink mb-2">Invoice tidak ditemukan</h2>
            <p className="text-ink/60 mb-4">Invoice yang Anda cari tidak ada atau telah dihapus.</p>
            <Link href="/">
              <Button>Kembali ke Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = invoice.status === 'lunas';
  const isOverdueOrDue = invoice.status === 'belum_bayar' || invoice.status === 'terlambat';

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <header className="border-b border-border-hairline bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-accent-stamp hover:underline text-sm">
              ← Kembali
            </Link>
            <h1 className="font-serif text-xl font-bold text-ink">Invoice #{id.slice(0, 8)}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('font-medium', getStatusColor(invoice.status))}>
              {getStatusLabel(invoice.status, invoice.jatuh_tempo)}
            </span>
            {isPaid && <Stempel />}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Info Grid */}
        <section className="mb-6" aria-labelledby="info-heading">
          <h2 id="info-heading" className="sr-only">Informasi Invoice</h2>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm text-ink/60 mb-1">Customer</dt>
                  <dd className="font-medium text-ink">{invoice.customer_name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-ink/60 mb-1">Nominal</dt>
                  <dd className="font-serif text-2xl font-bold text-ink">{formatCurrency(invoice.jumlah)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-ink/60 mb-1">Tanggal Terbit</dt>
                  <dd className="text-ink/70">{invoice.tanggal_terbit ? formatDateShort(invoice.tanggal_terbit) : '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-ink/60 mb-1">Jatuh Tempo</dt>
                  <dd className={cn('font-medium', invoice.status === 'terlambat' && 'text-status-overdue')}>
                    {invoice.jatuh_tempo ? formatDateShort(invoice.jatuh_tempo) : '-'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-ink/60 mb-1">Status</dt>
                  <dd className="flex items-center gap-3">
                    <span className={cn('font-medium', getStatusColor(invoice.status))}>
                      {getStatusLabel(invoice.status, invoice.jatuh_tempo)}
                    </span>
                    {isPaid && <Stempel />}
                  </dd>
                </div>
              </dl>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-border-hairline flex flex-wrap gap-3">
                {isOverdueOrDue && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => setShowConfirm(true)}
                      disabled={updateStatus.isPending}
                    >
                      {updateStatus.isPending ? 'Memproses...' : 'Tandai Lunas'}
                    </Button>
                    <Link href={`/invoices/${id}/edit`}>
                      <Button variant="secondary">Edit Invoice</Button>
                    </Link>
                  </>
                )}
                {isPaid && (
                  <Link href={`/invoices/${id}/edit`}>
                    <Button variant="secondary">Edit Invoice</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Follow-up Logs */}
        <section className="mb-6" aria-labelledby="followup-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="followup-heading" className="font-serif text-lg font-semibold text-ink">Riwayat Follow-up</h2>
          </div>

          <Card>
            <CardContent className="p-4 sm:p-6">
              {/* Follow-up Logs List */}
              {logsLoading ? (
                <div className="text-center py-8 text-ink/50">Memuat riwayat...</div>
              ) : logs && logs.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {logs.map((log) => (
                    <article
                      key={log.id}
                      className="p-4 border border-border-hairline bg-white/50"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded',
                            log.sumber === 'hermes'
                              ? 'bg-accent-stamp/10 text-accent-stamp'
                              : 'bg-ink/10 text-ink/70'
                          )}>
                            {log.sumber === 'hermes' ? 'Hermes' : 'Manual'}
                          </span>
                          <time className="text-sm text-ink/60">
                            {log.tanggal_kirim ? formatDateShort(log.tanggal_kirim) : '-'}
                          </time>
                        </div>
                      </div>
                      <p className="text-ink/80 whitespace-pre-wrap">{log.isi_pesan}</p>
                      {log.respon_customer && (
                        <div className="mt-2 p-2 bg-status-paid/10 border border-status-paid/20 rounded text-sm">
                          <span className="font-medium text-status-paid">Respon: </span>
                          <span className="text-ink/80">{log.respon_customer}</span>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-ink/50">
                  Belum ada catatan follow-up untuk invoice ini.
                </div>
              )}

              {/* Garis Perforasi */}
              <div className="my-4 border-t border-dashed border-border-hairline" aria-hidden="true" />

              {/* Manual Follow-up Form */}
              <h3 className="font-serif text-base font-semibold text-ink mb-3">Tambah Catatan Follow-up (Manual)</h3>
              <form onSubmit={handleSubmit(handleFollowUpSubmit)} className="space-y-3" noValidate>
                <div>
                  <Label htmlFor="isi_pesan">Isi Pesan</Label>
                  <Textarea
                    id="isi_pesan"
                    placeholder="Tulis pesan follow-up untuk customer..."
                    {...register('isi_pesan')}
                    disabled={createFollowUp.isPending}
                    rows={3}
                    aria-invalid={!!errors.isi_pesan}
                    aria-describedby={errors.isi_pesan ? 'isi_pesan-error' : followUpError ? 'followup-error' : undefined}
                  />
                  {errors.isi_pesan && (
                    <p id="isi_pesan-error" className="mt-1 text-sm text-status-overdue" role="alert">
                      {errors.isi_pesan.message}
                    </p>
                  )}
                  {followUpError && (
                    <p id="followup-error" className="mt-1 text-sm text-status-overdue" role="alert">
                      {followUpError}
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={createFollowUp.isPending} className="w-full sm:w-auto">
                  {createFollowUp.isPending ? 'Menyimpan...' : 'Simpan Catatan'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleMarkPaid}
        title="Tandai Lunas?"
        description={`Yakin ingin menandai invoice #{id.slice(0, 8)} untuk {invoice.customer_name} sebesar ${formatCurrency(invoice.jumlah)} sebagai lunas? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, tandai lunas"
        cancelText="Batal"
        variant="primary"
        isLoading={updateStatus.isPending}
      />
    </div>
  );
}

import { cn } from '@/lib/utils';