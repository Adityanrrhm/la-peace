'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Input, FloatingInput, Button, Card, CardContent, Label } from '@/components/ui';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await login(data.email, data.password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-bg-base">
      {/* Left */}
      <div className="hidden lg:block lg:w-1/2 bg-bg-base p-4 relative">
        <div className="relative w-full h-full overflow-hidden rounded-2xl">
          <img
            src="/day.png"
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ${isDark ? 'opacity-0' : 'opacity-100'}`}
          />
          <img
            src="/night.png"
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ${isDark ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
      </div>

      {/* Right */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 text-ink/40 hover:text-ink/70 transition-colors"
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
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-2">
              Tagira
            </h1>
            <p className="text-sm text-ink/60">Masuk ke dashboard piutang Anda</p>
          </div>

          {error && (
            <div
              className="mb-6 p-3 text-sm text-status-overdue bg-status-overdue/10 border border-status-overdue/20"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <FloatingInput
                id="email"
                type="email"
                label="Email"
                autoComplete="email"
                {...register('email')}
                disabled={isSubmitting || authLoading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-status-overdue" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <FloatingInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  autoComplete="current-password"
                  {...register('password')}
                  disabled={isSubmitting || authLoading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                      <path d="m2 2 20 20" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-status-overdue" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting || authLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-ink/50">
            Tagira v1.0 — Dashboard Piutang UMKM
          </p>
        </div>
      </div>
    </div>
  );
}
