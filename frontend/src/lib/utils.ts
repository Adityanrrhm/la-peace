import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function getDaysUntilDue(jatuhTempo: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(jatuhTempo);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getStatusLabel(status: string, jatuhTempo?: string): string {
  switch (status) {
    case 'lunas':
      return 'Lunas';
    case 'terlambat':
      if (jatuhTempo) {
        const days = getDaysUntilDue(jatuhTempo);
        return `Telat ${Math.abs(days)} hari`;
      }
      return 'Terlambat';
    case 'belum_bayar':
      if (jatuhTempo) {
        const days = getDaysUntilDue(jatuhTempo);
        if (days < 0) return `Telat ${Math.abs(days)} hari`;
        if (days === 0) return 'Jatuh tempo hari ini';
        if (days === 1) return 'Jatuh tempo besok';
        return `Jatuh tempo ${days} hari lagi`;
      }
      return 'Belum bayar';
    default:
      return status;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'lunas':
      return 'text-status-paid';
    case 'terlambat':
      return 'text-status-overdue';
    case 'belum_bayar':
      return 'text-ink/70';
    default:
      return 'text-ink/70';
  }
}