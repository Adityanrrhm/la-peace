'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBackLink?: boolean;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export function AppHeader({
  title,
  subtitle,
  showBackLink = false,
  backHref = '/',
  backLabel = 'Kembali',
  children,
  className,
}: AppHeaderProps) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (dark: boolean) => {
      setIsDark(dark);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <header className={`border-b border-border-hairline bg-bg-base sticky top-0 z-10 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackLink && (
            <a href={backHref} className="text-accent-stamp hover:underline text-sm mr-2">
              ← {backLabel}
            </a>
          )}
          <h1 className="font-serif text-xl font-bold text-ink">{title}</h1>
          {subtitle && <span className="hidden sm:inline text-sm text-ink/50">{subtitle}</span>}
        </div>
        <div className="flex items-center gap-4">
          {children}
          <span className="text-sm text-ink/70 hidden md:block">{user?.email}</span>
          <button
            onClick={toggleTheme}
            className="p-2 text-ink/40 hover:text-ink/70 transition-colors cursor-pointer"
            aria-label={isDark ? 'Mode terang' : 'Mode gelap'}
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2"/>
                <path d="M12 20v2"/>
                <path d="m4.93 4.93 1.41 1.41"/>
                <path d="m17.66 17.66 1.41 1.41"/>
                <path d="M2 12h2"/>
                <path d="M20 12h2"/>
                <path d="m6.34 17.66-1.41 1.41"/>
                <path d="m19.07 4.93-1.41 1.41"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>
          <Button variant="ghost" size="sm" onClick={logout}>Keluar</Button>
        </div>
      </div>
    </header>
  );
}