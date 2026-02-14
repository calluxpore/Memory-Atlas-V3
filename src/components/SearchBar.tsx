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
      className="font-mono w-full min-h-[44px] touch-target bg-transparent py-2.5 px-0 text-base text-text-primary placeholder-text-muted outline-none border-none focus:ring-0 md:min-h-0 md:py-2 md:text-sm"
      aria-label="Search memories by title, notes, or date"
    />
  );
}
