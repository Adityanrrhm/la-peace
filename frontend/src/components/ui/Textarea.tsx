'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'w-full px-3 py-2 text-sm font-sans text-ink bg-white',
          'border border-border-hairline',
          'placeholder:text-ink/40',
          'focus:outline-none focus:ring-2 focus:ring-accent-stamp/30 focus:border-accent-stamp',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-150',
          'resize-y min-h-[80px]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';