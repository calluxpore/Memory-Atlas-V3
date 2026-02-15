import { useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      <div
        ref={ref}
        className="w-full max-w-sm rounded-lg border border-border bg-background p-4 shadow-xl"
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      >
        <h2 id="confirm-title" className="font-display text-lg font-semibold text-text-primary">
          {title}
        </h2>
        <p id="confirm-desc" className="mt-2 text-text-secondary">
          {message}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-border bg-surface px-3 py-1.5 text-text-primary hover:bg-surface-elevated"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded px-3 py-1.5 ${danger ? 'bg-danger text-white hover:opacity-90' : 'bg-accent text-white hover:opacity-90'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
