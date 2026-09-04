'use client';

import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Ya',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={cn(
          'w-full max-w-md bg-white border border-border-hairline shadow-lg',
          'animate-slide-up'
        )} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <div className="p-4 sm:p-6 border-b border-border-hairline">
            <h3 id="dialog-title" className="font-serif text-lg font-semibold text-ink">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-ink/70">{description}</p>
            )}
          </div>
          <div className="p-4 sm:p-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}