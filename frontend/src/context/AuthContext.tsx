'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useMe } from '@/hooks/useApi';
import type { MeResponse } from '@/types/api';

interface AuthContextType {
  user: MeResponse['data'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
      // Force refetch to clear user
      refetch();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refetch]);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important for HttpOnly cookie
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login gagal');
    }

    // Refetch user after successful login
    await refetch();
  };

  const logout = () => {
    // Clear user state immediately
    // Note: backend doesn't have logout endpoint yet, so we just clear client state
    // The cookie will expire on its own
    refetch();
  };

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