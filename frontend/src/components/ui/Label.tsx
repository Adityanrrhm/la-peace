'use client';

import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        className={cn(
          'block text-sm font-sans font-medium text-ink mb-1.5',
          'capitalize', // sentence case
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </label>
    );
  }
);
Label.displayName = 'Label';