'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, type = 'text', ...props }, ref) => {
    return (
      <div className="floating-input relative">
        <input
          ref={ref}
          type={type}
          className={cn(
            'floating-input__input w-full p-4 text-sm font-sans text-ink bg-transparent rounded-lg',
            'border border-border-hairline',
            'placeholder:text-transparent',
            'focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-150',
            className
          )}
          placeholder=" "
          spellCheck={false}
          {...props}
        />
        <label className="floating-input__label">
          {label}
        </label>
      </div>
    );
  }
);
FloatingInput.displayName = 'FloatingInput';
