'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useMe } from '@/hooks/useApi';
import type { MeResponse } from '@/types/api';

interface AuthContextType {
  user: MeResponse['data'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { data: user, isLoading, error, refetch } = useMe();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Listen for unauthorized events from API interceptor
    const handleUnauthorized = () => {
      refetch();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refetch]);

  const login = useCallback(async (email: string, password: string) => {
    // Gunakan path relatif /api/v1 agar melalui proxy Next.js (same-origin)
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Login gagal');
    }

    await refetch();
  }, [refetch]);

  const logout = useCallback(async () => {
    try {
      // Hapus cookie di backend — Set-Cookie dengan MaxAge=0
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Lanjutkan meskipun request gagal
    } finally {
      // Invalidate query agar useMe() kembali null
      refetch();
    }
  }, [refetch]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="animate-pulse text-ink/50">Memuat...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: isLoading && !error,
        isAuthenticated: !!user && !error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}