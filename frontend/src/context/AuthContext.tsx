'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMe, queryKeys } from '@/hooks/useApi';
import type { MeResponse } from '@/types/api';

interface AuthContextType {
  user: MeResponse['data'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<MeResponse['data'] | undefined>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [manualUser, setManualUser] = useState<MeResponse['data'] | null>(null);
  const { data: meUser, isLoading, error, refetch } = useMe();
  const queryClient = useQueryClient();

  const user = manualUser ?? meUser ?? null;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setManualUser(null);
      refetch();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refetch]);

  const login = useCallback(async (email: string, password: string) => {
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

    const result = await response.json();
    const userData = result.data?.user;
    if (userData) {
      setManualUser(userData);
      queryClient.setQueryData(queryKeys.auth.me, userData);
    }
    return userData;
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // continue even if request fails
    } finally {
      setManualUser(null);
      queryClient.setQueryData(queryKeys.auth.me, null);
    }
  }, [queryClient]);

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
        user,
        isLoading: isLoading && !error && !manualUser,
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