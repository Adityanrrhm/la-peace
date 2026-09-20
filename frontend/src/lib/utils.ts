export { cn } from "cn"

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateShort(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getStatusLabel(status: string, jatuhTempo?: string): string {
  if (status === 'lunas') return 'Lunas'
  if (status === 'terlambat') return 'Terlambat'
  if (status === 'belum_bayar') {
    if (jatuhTempo) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tempo = new Date(jatuhTempo)
      tempo.setHours(0, 0, 0, 0)
      if (tempo.getTime() === today.getTime()) return 'Jatuh tempo hari ini'
      if (tempo < today) return 'Terlambat'
    }
    return 'Belum bayar'
  }
  return status
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'lunas': return 'text-status-paid font-medium'
    case 'terlambat': return 'text-status-overdue font-medium'
    case 'belum_bayar': return 'text-ink/70 font-medium'
    default: return 'text-ink/70'
  }
}
