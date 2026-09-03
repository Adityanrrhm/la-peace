'use client';

import { cn } from '@/lib/utils';

interface StempelProps {
  className?: string;
  text?: string;
}

export function Stempel({ className, text = 'LUNAS' }: StempelProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'font-serif font-bold text-accent-stamp',
        'border-2 border-accent-stamp rounded-full',
        'rotate-[-8deg]',
        'px-3 py-1',
        'shadow-[2px_2px_0px_#DDD8CC]',
        'transition-all duration-300 ease-out',
        'animate-fade-in',
        className
      )}
      style={{ fontSize: '0.875rem' }}
    >
      {text}
    </span>
  );
}