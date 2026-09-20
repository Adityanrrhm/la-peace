'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useCustomers, useInvoice, useUpdateInvoice } from '@/hooks/useApi';
import { Button, Card, CardContent, Label, Input, Select, SelectItem, useToast } from '@/components/ui';
import { AppHeader } from '@/components/layout/AppHeader';

const invoiceSchema = z.object({
  customer_id: z.string().uuid('Pilih customer yang valid'),
  jumlah: z.coerce.number().min(1, 'Nominal minimal 1'),
  tanggal_terbit: z.string().min(1, 'Tanggal terbit harus diisi'),
  jatuh_tempo: z.string().min(1, 'Jatuh tempo harus diisi'),
}).refine((data) => new Date(data.jatuh_tempo) >= new Date(data.tanggal_terbit), {
  message: 'Jatuh tempo tidak boleh sebelum tanggal terbit',
  path: ['jatuh_tempo'],
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function InvoiceEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { addToast } = useToast();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: customersData, isLoading: customersLoading } = useCustomers({ page_size: 100 });
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id);
  const updateInvoice = useUpdateInvoice();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    // values (bukan defaultValues/setValue)  buat ngesync data server ke form
    // tiap query update tanpa ngereset field yang lagi diketik
    values: invoice
      ? {
          customer_id: invoice.customer_id,
          jumlah: invoice.jumlah,
          tanggal_terbit: invoice.tanggal_terbit,
          jatuh_tempo: invoice.jatuh_tempo,
        }
      : undefined,
  });

  const onSubmit = async (data: InvoiceFormData) => {
    setSubmitError(null);
    try {
      await updateInvoice.mutateAsync({
        id,
        data: {
          customer_id: data.customer_id,
          jumlah: data.jumlah,
          jatuh_tempo: data.jatuh_tempo,
        },
      });

      addToast({ type: 'success', title: 'Invoice diperbarui', description: 'Perubahan telah disimpan' });
      router.push(`/invoices/${id}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengupdate invoice';
      setSubmitError(message);
      addToast({ type: 'error', title: 'Gagal mengupdate', description: message });
    }
  };

  if (invoiceLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-pulse text-ink/50">Memuat invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="font-serif text-xl font-bold text-ink mb-2">Invoice tidak ditemukan</h2>
            <Link href="/">
              <Button>Kembali ke Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customers = customersData?.data?.customers ?? [];

  return (
    <div className="min-h-screen bg-bg-base">
      <AppHeader title="Edit Invoice" showBackLink backHref={`/invoices/${id}`} backLabel="Kembali" />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {submitError && (
                <div className="p-3 text-sm text-status-overdue bg-status-overdue/10 border border-status-overdue/20 rounded" role="alert">
                  {submitError}
                </div>
              )}

              <div>
                <Label htmlFor="customer_id">Customer</Label>
                <Select
                  value={watch('customer_id')}
                  onChange={(e) => setValue('customer_id', e.target.value)}
                  className="w-full"
                  disabled={customersLoading || updateInvoice.isPending}
                >
                  <SelectItem value="" disabled>Pilih customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.nama} {customer.kontak_telegram && `(@${customer.kontak_telegram.replace('@', '')})`}
                    </SelectItem>
                  ))}
                </Select>
                {errors.customer_id && (
                  <p className="mt-1 text-sm text-status-overdue" role="alert">{errors.customer_id.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="jumlah">Nominal (Rp)</Label>
                  <Input
                    id="jumlah"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="100000"
                    {...register('jumlah')}
                    disabled={isSubmitting || updateInvoice.isPending}
                    aria-invalid={!!errors.jumlah}
                    aria-describedby={errors.jumlah ? 'jumlah-error' : undefined}
                  />
                  {errors.jumlah && (
                    <p id="jumlah-error" className="mt-1 text-sm text-status-overdue" role="alert">
                      {errors.jumlah.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tanggal_terbit">Tanggal Terbit</Label>
                  <Input
                    id="tanggal_terbit"
                    type="date"
                    {...register('tanggal_terbit')}
                    disabled // Tanggal terbit tidak bisa diubah
                    aria-invalid={!!errors.tanggal_terbit}
                    aria-describedby={errors.tanggal_terbit ? 'tanggal_terbit-error' : undefined}
                  />
                  {errors.tanggal_terbit && (
                    <p id="tanggal_terbit-error" className="mt-1 text-sm text-status-overdue" role="alert">
                      {errors.tanggal_terbit.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-ink/50">Tanggal terbit tidak dapat diubah</p>
                </div>

                <div>
                  <Label htmlFor="jatuh_tempo">Jatuh Tempo</Label>
                  <Input
                    id="jatuh_tempo"
                    type="date"
                    min={invoice.tanggal_terbit}
                    {...register('jatuh_tempo')}
                    disabled={isSubmitting || updateInvoice.isPending}
                    aria-invalid={!!errors.jatuh_tempo}
                    aria-describedby={errors.jatuh_tempo ? 'jatuh_tempo-error' : undefined}
                  />
                  {errors.jatuh_tempo && (
                    <p id="jatuh_tempo-error" className="mt-1 text-sm text-status-overdue" role="alert">
                      {errors.jatuh_tempo.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border-hairline flex flex-col sm:flex-row gap-3 justify-end">
                <Link href={`/invoices/${id}`} className="flex-1 sm:flex-none">
                  <Button type="button" variant="secondary" className="w-full sm:w-auto">
                    Batal
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting || updateInvoice.isPending}
                  className="flex-1 sm:w-auto"
                >
                  {isSubmitting || updateInvoice.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
