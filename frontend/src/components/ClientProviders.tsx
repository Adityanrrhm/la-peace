'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 0, // Don't cache after unmount - forces fresh fetch on refresh
        retry: 1,
        refetchOnWindowFocus: true, // Refetch on window focus/refresh
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isLoading) {
      setAuthChecked(true);
    }
  }, [isLoading, hydrated]);

  useEffect(() => {
    if (authChecked && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, authChecked, pathname, router]);

  if (!hydrated || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="animate-pulse text-ink/50">Memuat...</div>
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ProtectedLayout>{children}</ProtectedLayout>
    </Providers>
  );
}
