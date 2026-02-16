import { useRef, useEffect } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import { FOCUS_SEARCH_EVENT } from '../hooks/useKeyboardShortcuts';

export function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchQuery = useMemoryStore((s) => s.searchQuery);
  const setSearchQuery = useMemoryStore((s) => s.setSearchQuery);

  useEffect(() => {
    const fn = () => inputRef.current?.focus();
    window.addEventListener(FOCUS_SEARCH_EVENT, fn);
    return () => window.removeEventListener(FOCUS_SEARCH_EVENT, fn);
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search memories... (/)"
      className="font-mono w-full min-h-[28px] touch-target bg-transparent py-1 px-0 text-xs text-text-primary placeholder-text-muted outline-none border-none focus:ring-0"
      aria-label="Search memories by title, notes, or date"
    />
  );
}
