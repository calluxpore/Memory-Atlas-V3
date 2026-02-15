import { useState, useCallback, useRef, useEffect } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import { formatDate } from '../utils/formatDate';
import { formatCoords } from '../utils/formatCoords';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { ConfirmDialog } from './ConfirmDialog';
import type { Memory } from '../types/memory';

interface MemoryViewerProps {
  memory: Memory;
  onClose: () => void;
}

export function MemoryViewer({ memory, onClose }: MemoryViewerProps) {
  const removeMemory = useMemoryStore((s) => s.removeMemory);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [hasHover, setHasHover] = useState(false);
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = window.matchMedia('(hover: hover)');
    setHasHover(m.matches);
    const fn = () => setHasHover(m.matches);
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = photoRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      setParallax({ x: dx * 8, y: dy * 8 });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setParallax({ x: 0, y: 0 });
  }, []);

  const handleRemove = () => setShowRemoveConfirm(true);
  const confirmRemove = () => {
    removeMemory(memory.id);
    onClose();
    setShowRemoveConfirm(false);
  };

  const [active, setActive] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(viewerRef, true);
  useEffect(() => {
    const t = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      ref={viewerRef}
      className={`memory-viewer-enter fixed inset-0 z-[1000] flex flex-col bg-background md:flex-row ${active ? 'active' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Memory details"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="touch-target absolute right-4 top-4 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center text-text-secondary transition-colors hover:text-text-primary active:opacity-80"
        style={{
          top: 'max(1rem, env(safe-area-inset-top, 0px))',
          right: 'max(1rem, env(safe-area-inset-right, 0px))',
        }}
        aria-label="Close"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto overscroll-contain p-4 pb-8 md:order-1 md:max-w-[50%] md:p-6 md:pr-12 md:pt-16">
        <div>
          <p className="font-mono text-sm text-accent">
            {formatCoords(memory.lat, memory.lng)}
          </p>
          <h2 className="font-display mt-2 text-2xl font-semibold text-text-primary md:text-5xl">
            {memory.title || 'Untitled'}
          </h2>
          <p className="font-mono mt-2 text-sm text-text-secondary">
            {formatDate(memory.date, true)}
          </p>
          {memory.notes && (
            <p className="font-body mt-6 text-text-primary/90 leading-relaxed">
              {memory.notes}
            </p>
          )}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove memory from atlas"
            className="font-mono touch-target min-h-[44px] min-w-[80px] px-3 text-sm text-danger underline-offset-2 hover:underline active:opacity-80"
          >
            REMOVE FROM ATLAS
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={showRemoveConfirm}
        title="Remove memory"
        message="Remove this memory from the atlas?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        danger
        onConfirm={confirmRemove}
        onCancel={() => setShowRemoveConfirm(false)}
      />

      <div
        ref={photoRef}
        className="relative order-first h-[40vh] flex-shrink-0 overflow-hidden bg-surface-elevated md:order-2 md:h-full md:min-h-0 md:flex-1"
        onMouseMove={hasHover ? handleMouseMove : undefined}
        onMouseLeave={hasHover ? handleMouseLeave : undefined}
      >
        {memory.imageDataUrl ? (
          <img
            src={memory.imageDataUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-150 ease-out"
            style={
              hasHover
                ? { transform: `translate(${parallax.x}px, ${parallax.y}px) scale(1.05)` }
                : undefined
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted font-mono text-sm">
            No photo
          </div>
        )}
      </div>
    </div>
  );
}
