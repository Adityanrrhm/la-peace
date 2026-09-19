'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant: variantProp = 'primary', size: sizeProp = 'md', disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-sans font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent-stamp/30 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary: 'bg-accent-stamp text-white hover:bg-accent-stamp/90 active:bg-accent-stamp border-0',
      secondary: 'bg-white dark:bg-ink/10 text-ink border border-border-hairline hover:bg-ink/5 active:bg-ink/10',
      danger: 'bg-status-overdue text-white hover:bg-status-overdue/90 active:bg-status-overdue border-0',
      ghost: 'text-ink hover:bg-ink/5 active:bg-ink/10 border-0',
    };

    const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
    };

    const variant = variantStyles[variantProp ?? 'primary'];
    const size = sizeStyles[sizeProp ?? 'md'];

    return (
      <button
        className={cn(baseStyles, variant, size, className)}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';