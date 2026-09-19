'use client';

import { cn } from '@/lib/utils';
import type { SortDirection } from '@/types/api';

interface TableHeaderProps {
  children: React.ReactNode;
  sortBy?: string;
  currentSortBy?: string;
  currentSortDir?: SortDirection;
  onSort?: (field: string) => void;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export function TableHeader({
  children,
  sortBy,
  currentSortBy,
  currentSortDir,
  onSort,
  className,
  align = 'left',
}: TableHeaderProps) {
  const isSorted = sortBy === currentSortBy;
  const isClickable = !!onSort && sortBy;

  return (
    <th
      className={cn(
        'px-4 py-3 font-sans font-medium text-ink/70',
        'border-b border-border-hairline bg-white/50 dark:bg-ink/5',
        'transition-colors duration-150',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        isClickable && 'cursor-pointer hover:bg-ink/5 select-none',
        className
      )}
      onClick={() => isClickable && onSort(sortBy)}
      style={{ userSelect: isClickable ? 'none' : 'auto' }}
    >
      <div className="flex items-center justify-between gap-1">
        <span>{children}</span>
        {isClickable && (
          <span className="inline-flex items-center text-ink/40">
            {isSorted ? (
              currentSortDir === 'asc' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )
            ) : (
              <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            )}
          </span>
        )}
      </div>
    </th>
  );
}
