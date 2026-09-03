'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full px-3 py-2 text-sm font-sans text-ink bg-white',
          'border border-border-hairline',
          'placeholder:text-ink/40',
          'focus:outline-none focus:ring-2 focus:ring-accent-stamp/30 focus:border-accent-stamp',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-150',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';