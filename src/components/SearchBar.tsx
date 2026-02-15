import { useMemoryStore } from '../store/memoryStore';

export function SearchBar() {
  const searchQuery = useMemoryStore((s) => s.searchQuery);
  const setSearchQuery = useMemoryStore((s) => s.setSearchQuery);

  return (
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search memories..."
      className="font-mono w-full min-h-[28px] touch-target bg-transparent py-1 px-0 text-xs text-text-primary placeholder-text-muted outline-none border-none focus:ring-0"
      aria-label="Search memories by title, notes, or date"
    />
  );
}
