import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(el: HTMLElement | null): HTMLElement[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/**
 * Traps focus inside the container (e.g. modal). Tab / Shift+Tab cycle within the container.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const el = containerRef.current;
    const focusable = getFocusable(el);
    if (focusable.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const current = document.activeElement;
      if (!current || !(current instanceof HTMLElement)) return;
      if (!el.contains(current)) {
        e.preventDefault();
        const firstEl = focusable[0];
        if (firstEl) firstEl.focus();
        return;
      }
      const idx = focusable.indexOf(current);
      if (idx === -1) return;
      if (e.shiftKey) {
        if (idx === 0) {
          e.preventDefault();
          const lastEl = focusable[focusable.length - 1];
          if (lastEl) lastEl.focus();
        }
      } else {
        if (idx === focusable.length - 1) {
          e.preventDefault();
          const firstEl = focusable[0];
          if (firstEl) firstEl.focus();
        }
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    const first = focusable[0];
    if (first) first.focus();
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [active, containerRef]);
}
