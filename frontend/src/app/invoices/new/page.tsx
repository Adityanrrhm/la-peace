'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useCustomers, useCreateInvoice } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';
import { Button, Card, CardContent, CardHeader, Label, Input, Select, SelectItem, useToast } from '@/components/ui';
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

export default function InvoiceFormPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: customersData, isLoading: customersLoading } = useCustomers({ page_size: 100 });
  const createInvoice = useCreateInvoice();

  const defaultValues: InvoiceFormData = {
    customer_id: '',
    jumlah: 0,
    tanggal_terbit: new Date().toISOString().split('T')[0],
    jatuh_tempo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues,
  });

  const onSubmit = async (data: InvoiceFormData) => {
    setSubmitError(null);
    try {
      await createInvoice.mutateAsync(data);
      addToast({ type: 'success', title: 'Invoice dibuat', description: 'Invoice baru telah disimpan' });
      router.push('/');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan invoice';
      setSubmitError(message);
      addToast({ type: 'error', title: 'Gagal menyimpan', description: message });
    }
  };

  const customers = customersData?.data?.customers ?? [];

  return (
    <div className="min-h-screen bg-bg-base">
      <AppHeader title="Tambah Invoice Baru" showBackLink backHref="/" backLabel="Kembali" />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {submitError && (
                <div className="p-3 text-sm text-status-overdue bg-status-overdue/10 border border-status-overdue/20" role="alert">
                  {submitError}
                </div>
              )}

              <div>
                <Label htmlFor="customer_id">Customer</Label>
                <Select
                  value={watch('customer_id')}
                  onChange={(e) => setValue('customer_id', e.target.value)}
                  className="w-full"
                  disabled={customersLoading || createInvoice.isPending}
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
                {customersLoading && <p className="mt-1 text-xs text-ink/50">Memuat daftar customer...</p>}
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
                    disabled={createInvoice.isPending}
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
                    disabled={createInvoice.isPending}
                    aria-invalid={!!errors.tanggal_terbit}
                    aria-describedby={errors.tanggal_terbit ? 'tanggal_terbit-error' : undefined}
                  />
                  {errors.tanggal_terbit && (
                    <p id="tanggal_terbit-error" className="mt-1 text-sm text-status-overdue" role="alert">
                      {errors.tanggal_terbit.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="jatuh_tempo">Jatuh Tempo</Label>
                  <Input
                    id="jatuh_tempo"
                    type="date"
                    min={watch('tanggal_terbit') || undefined}
                    {...register('jatuh_tempo')}
                    disabled={createInvoice.isPending}
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
                <Link href="/" className="flex-1 sm:flex-none">
                  <Button type="button" variant="secondary" className="w-full sm:w-auto">
                    Batal
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createInvoice.isPending || customersLoading}
                  className="flex-1 sm:w-auto"
                >
                  {isSubmitting || createInvoice.isPending ? 'Menyimpan...' : 'Simpan Invoice'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}