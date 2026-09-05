import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tagira — Dashboard Piutang',
  description: 'Dashboard manajemen piutang untuk UMKM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-screen bg-bg-base font-sans text-ink">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}