'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useCreateCustomer } from '@/hooks/useApi';
import { Button, Card, CardContent, CardHeader, Label, Input } from '@/components/ui';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const customerSchema = z.object({
  nama: z.string().min(1, 'Nama harus diisi').max(255, 'Nama maksimal 255 karakter'),
  kontak_telegram: z.string().optional().refine(
    (val) => !val || val.startsWith('@') || val.startsWith('+') || val.startsWith('0') || val === '',
    { message: 'Format kontak tidak valid (gunakan @username atau nomor telepon)' }
  ),
  catatan_perilaku_bayar: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomerNewPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createCustomer = useCreateCustomer();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      nama: '',
      kontak_telegram: '',
      catatan_perilaku_bayar: '',
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    setSubmitError(null);
    try {
      await createCustomer.mutateAsync({
        nama: data.nama,
        kontak_telegram: data.kontak_telegram || undefined,
        catatan_perilaku_bayar: data.catatan_perilaku_bayar || undefined,
      });

      router.push('/customers');
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal menambah customer');
    }
  };

  return (
    <DashboardLayout>
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
                  placeholder="Nama customer"
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
                  placeholder="@username atau 081234567890"
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
                  placeholder="Contoh: Pembayar lancar, butuh pengingat H-1, dll"
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Customer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  );
}