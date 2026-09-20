'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Button, Card, CardContent, CardHeader, Label, Stempel, TableHeader } from '@/components/ui';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import Link from 'next/link';
import { useCustomers } from '@/hooks/useApi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SearchIcon } from 'lucide-react';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

  const { data: customersData, isLoading: customersLoading } = useCustomers({
    page,
    page_size: pageSize,
    nama: search || undefined,
  });

  const customers = customersData?.data?.customers ?? [];
  const totalPages = customersData?.meta?.total_pages ?? 1;
  const currentPage = customersData?.meta?.page ?? 1;
  const totalItems = customersData?.meta?.total_items ?? 0;

  const updateFilters = useCallback((newParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    if (newParams.page === undefined) {
      params.set('page', '1');
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handlePageChange = useCallback((newPage: number) => {
    updateFilters({ page: newPage });
  }, [updateFilters]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    updateFilters({ page_size: newSize, page: 1 });
  }, [updateFilters]);

  const handleSearchChange = useCallback((value: string) => {
    updateFilters({ search: value || undefined });
  }, [updateFilters]);

  const hasActiveFilters = search;

  return (
    <DashboardLayout>
      <main className="px-4 py-6">
        <section aria-labelledby="daftar-customer-heading">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <h2 id="daftar-customer-heading" className="font-serif text-lg font-semibold text-ink">Daftar Customer</h2>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={() => router.push('/customers')}>
                  Reset pencarian
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/customers/new">
                <Button size="sm">+ Tambah Customer</Button>
              </Link>
              <InputGroup className="w-64">
                <InputGroupAddon align="inline-start">
                  <SearchIcon className="size-4 text-ink/40" aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  placeholder="Cari nama customer..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  aria-label="Cari customer"
                />
              </InputGroup>
              <Select value={String(pageSize)} onValueChange={(v) => handlePageSizeChange(parseInt(v, 10))}>
                <SelectTrigger className="w-auto min-w-[100px]" aria-label="Item per halaman">
                  <SelectValue placeholder={`${pageSize} per halaman`} />
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
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm table-fixed rounded-table" role="table">
                <thead>
                  <tr className="bg-white/50 dark:bg-ink/5">
                    <TableHeader sortBy="nama" currentSortBy="" currentSortDir="desc" onSort={() => {}} align="left">
                      Nama
                    </TableHeader>
                    <TableHeader sortBy="kontak_telegram" currentSortBy="" currentSortDir="desc" onSort={() => {}} align="left">
                      Kontak Telegram
                    </TableHeader>
                    <th className="px-4 py-3 text-left font-sans font-medium text-ink/70"></th>
                  </tr>
                </thead>
                <tbody>
                  {customersLoading ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-ink/50">
                        Memuat customer...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-ink/50">
                        Belum ada customer — <Link href="/customers/new" className="text-accent-stamp hover:underline">tambah customer pertama kamu</Link>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-ink/[0.02] transition-colors cursor-pointer"
                        onClick={() => router.push(`/customers/${customer.id}`)}
                      >
                        <td className="px-4 py-3 font-medium text-ink">{customer.nama}</td>
                        <td className="px-4 py-3 text-ink/70">{customer.kontak_telegram || <span className="text-ink/40">—</span>}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/customers/${customer.id}`}
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
                Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} dari {totalItems} customer
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
