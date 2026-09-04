'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useCustomer } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';
import { Button, Card, CardContent, CardHeader, Label, Input, Stempel } from '@/components/ui';

const customerSchema = z.object({
  nama: z.string().min(1, 'Nama harus diisi').max(255, 'Nama maksimal 255 karakter'),
  kontak_telegram: z.string().optional().refine(
    (val) => !val || val.startsWith('@') || val.startsWith('+') || val.startsWith('0') || val === '',
    { message: 'Format kontak tidak valid (gunakan @username atau nomor telepon)' }
  ),
  catatan_perilaku_bayar: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: customer, isLoading: customerLoading, refetch } = useCustomer(id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      nama: '',
      kontak_telegram: '',
      catatan_perilaku_bayar: '',
    },
  });

  // Prefill form when customer data loads
  if (customer && !customerLoading) {
    setValue('nama', customer.nama, { shouldValidate: true });
    setValue('kontak_telegram', customer.kontak_telegram || '', { shouldValidate: true });
    setValue('catatan_perilaku_bayar', customer.catatan_perilaku_bayar || '', { shouldValidate: true });
  }

  const onSubmit = async (data: CustomerFormData) => {
    setSubmitError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gagal mengupdate customer');
      }

      await refetch();
      router.push('/customers');
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal mengupdate customer');
    }
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-pulse text-ink/50">Memuat customer...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="font-serif text-xl font-bold text-ink mb-2">Customer tidak ditemukan</h2>
            <p className="text-ink/60 mb-4">Customer yang Anda cari tidak ada atau telah dihapus.</p>
            <Link href="/customers">
              <Button>Kembali ke Daftar Customer</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="border-b border-border-hairline bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/customers" className="text-accent-stamp hover:underline text-sm">
              ← Kembali
            </Link>
            <h1 className="font-serif text-xl font-bold text-ink">Detail Customer</h1>
          </div>
        </div>
      </header>

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
                <Label htmlFor="nama">Nama</Label>
                <Input
                  id="nama"
                  type="text"
                  {...register('nama')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.nama}
                  aria-describedby={errors.nama ? 'nama-error' : undefined}
                />
                {errors.nama && (
                  <p id="nama-error" className="mt-1 text-sm text-status-overdue" role="alert">
                    {errors.nama.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="kontak_telegram">Kontak Telegram / Telepon</Label>
                <Input
                  id="kontak_telegram"
                  type="text"
                  {...register('kontak_telegram')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.kontak_telegram}
                  aria-describedby={errors.kontak_telegram ? 'kontak_telegram-error' : undefined}
                />
                {errors.kontak_telegram && (
                  <p id="kontak_telegram-error" className="mt-1 text-sm text-status-overdue" role="alert">
                    {errors.kontak_telegram.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-ink/50">Format: @username untuk Telegram, atau nomor telepon</p>
              </div>

              <div>
                <Label htmlFor="catatan_perilaku_bayar">Catatan Perilaku Bayar</Label>
                <Input
                  id="catatan_perilaku_bayar"
                  type="text"
                  {...register('catatan_perilaku_bayar')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.catatan_perilaku_bayar}
                  aria-describedby={errors.catatan_perilaku_bayar ? 'catatan_perilaku_bayar-error' : undefined}
                />
                {errors.catatan_perilaku_bayar && (
                  <p id="catatan_perilaku_bayar-error" className="mt-1 text-sm text-status-overdue" role="alert">
                    {errors.catatan_perilaku_bayar.message}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-border-hairline flex flex-col sm:flex-row gap-3 justify-end">
                <Link href="/customers" className="flex-1 sm:flex-none">
                  <Button type="button" variant="secondary" className="w-full sm:w-auto">
                    Batal
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:w-auto"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}