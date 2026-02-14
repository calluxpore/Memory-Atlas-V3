import { useRef, useState, useEffect } from 'react';
import { useMapRef } from '../context/MapContext';
import { useMemoryStore } from '../store/memoryStore';
import { SearchBar } from './SearchBar';
import type { Memory } from '../types/memory';

const UNGROUPED_ID = '__ungrouped__';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function memoryMatchesSearch(m: Memory, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.toLowerCase();
  return (
    m.title.toLowerCase().includes(lower) ||
    m.notes.toLowerCase().includes(lower) ||
    m.date.toLowerCase().includes(lower)
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const i = lower.indexOf(q);
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-accent">{text.slice(i, i + query.length)}</span>
      {text.slice(i + query.length)}
    </>
  );
}

function MemoryListItem({
  memory,
  searchQuery,
  onClick,
  onToggleHide,
}: {
  memory: Memory;
  searchQuery: string;
  onClick: (e: React.MouseEvent) => void;
  onToggleHide: (e: React.MouseEvent) => void;
}) {
  const isHidden = memory.hidden ?? false;
  return (
    <div className="group/mem flex w-full min-h-[44px] touch-target items-center gap-1 rounded-sm border-l-2 border-transparent bg-transparent py-2 pl-3 pr-1 transition-colors hover:bg-surface-elevated hover:border-accent active:bg-surface-elevated">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className={`flex min-h-[44px] min-w-0 flex-1 touch-target items-center gap-3 py-2 text-left ${isHidden ? 'opacity-50' : ''}`}
      >
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-sm bg-surface-elevated">
          {memory.imageDataUrl ? (
            <img
              src={memory.imageDataUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-muted font-mono text-xs">
              —
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-text-primary truncate text-sm font-medium">
            {highlightMatch(memory.title || 'Untitled', searchQuery)}
          </div>
          <div className="font-mono text-xs text-text-secondary">
            {formatDate(memory.date)}
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleHide(e);
        }}
        className="flex-shrink-0 touch-target min-h-[44px] min-w-[44px] p-2.5 text-text-muted hover:text-accent active:text-accent"
        aria-label={isHidden ? 'Show on map' : 'Hide from map'}
        title={isHidden ? 'Show on map' : 'Hide from map'}
      >
        {isHidden ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24 4.24" />
            <path d="M1 1l22 22" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

function GroupSection({
  id,
  name,
  memories,
  searchQuery,
  collapsed,
  hidden,
  onToggleCollapse,
  onToggleHide,
  onDelete,
  onMemoryClick,
  onMemoryToggleHide,
  isUngrouped,
  openForRename,
  onClearOpenForRename,
}: {
  id: string;
  name: string;
  memories: Memory[];
  searchQuery: string;
  collapsed: boolean;
  hidden: boolean;
  onToggleCollapse: () => void;
  onToggleHide: () => void;
  onDelete: () => void;
  onMemoryClick: (e: React.MouseEvent, m: Memory) => void;
  onMemoryToggleHide: (e: React.MouseEvent, m: Memory) => void;
  isUngrouped: boolean;
  openForRename?: boolean;
  onClearOpenForRename?: () => void;
}) {
  const [editingName, setEditingName] = useState(!!openForRename);
  const [editValue, setEditValue] = useState(name);
  const updateGroup = useMemoryStore((s) => s.updateGroup);
  useEffect(() => setEditValue(name), [name]);
  useEffect(() => {
    if (openForRename) setEditingName(true);
  }, [openForRename]);

  const handleBlur = () => {
    setEditingName(false);
    onClearOpenForRename?.();
    if (editValue.trim() && editValue.trim() !== name) {
      updateGroup(id, { name: editValue.trim() });
    } else {
      setEditValue(name);
    }
  };

  const isHidden = hidden ?? false;
  return (
    <div className={`py-1 ${isHidden ? 'opacity-70' : ''}`}>
      <div
        className="flex items-center gap-1 rounded-sm border border-transparent hover:border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="touch-target flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center p-2 text-text-muted hover:text-text-primary"
          aria-label={collapsed ? 'Expand group' : 'Collapse group'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${collapsed ? '-rotate-90' : ''}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {editingName && !isUngrouped ? (
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget.blur(), handleBlur())}
            className="font-mono flex-1 bg-transparent py-0.5 text-xs text-text-primary outline-none"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => !isUngrouped && setEditingName(true)}
            className="font-mono flex-1 truncate py-0.5 text-left text-xs font-medium text-text-secondary"
          >
            {name}
          </button>
        )}
        {!isUngrouped && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleHide();
              }}
              className="touch-target flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center p-2 text-text-muted hover:text-accent"
              aria-label={isHidden ? 'Show group on map' : 'Hide group from map'}
              title={isHidden ? 'Show on map' : 'Hide from map'}
            >
              {isHidden ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24 4.24" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="touch-target flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center p-2 text-text-muted hover:text-danger"
              aria-label="Delete group"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </>
        )}
      </div>
      {!collapsed && (
        <div className="ml-2 mt-0.5 space-y-0.5 border-l border-border pl-2">
          {memories.map((m) => (
            <div
              key={m.id}
              className={`transition-opacity duration-200 ${
                memoryMatchesSearch(m, searchQuery) ? 'opacity-100' : 'opacity-20'
              }`}
            >
              <MemoryListItem
                memory={m}
                searchQuery={searchQuery}
                onClick={(e) => onMemoryClick(e, m)}
                onToggleHide={(e) => onMemoryToggleHide(e, m)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const map = useMapRef();
  const memories = useMemoryStore((s) => s.memories);
  const groups = useMemoryStore((s) => s.groups);
  const searchQuery = useMemoryStore((s) => s.searchQuery);
  const sidebarOpen = useMemoryStore((s) => s.sidebarOpen);
  const setSidebarOpen = useMemoryStore((s) => s.setSidebarOpen);
  const setSelectedMemory = useMemoryStore((s) => s.setSelectedMemory);
  const addGroup = useMemoryStore((s) => s.addGroup);
  const removeGroup = useMemoryStore((s) => s.removeGroup);
  const updateGroup = useMemoryStore((s) => s.updateGroup);
  const updateMemory = useMemoryStore((s) => s.updateMemory);
  const panelRef = useRef<HTMLDivElement>(null);
  const [ungroupedCollapsed, setUngroupedCollapsed] = useState(false);
  const [openForRenameId, setOpenForRenameId] = useState<string | null>(null);

  const handleMemoryClick = (e: React.MouseEvent, memory: Memory) => {
    e.stopPropagation();
    e.preventDefault();
    if (map) {
      map.flyTo([memory.lat, memory.lng], map.getZoom(), { duration: 0.5 });
    }
    setSelectedMemory(memory);
  };

  const ungroupedMemories = memories.filter((m) => !(m.groupId ?? null));
  const createNewGroup = () => {
    const id = crypto.randomUUID();
    addGroup({
      id,
      name: 'New group',
      collapsed: false,
    });
    setOpenForRenameId(id);
  };

  const handleMemoryToggleHide = (e: React.MouseEvent, m: Memory) => {
    e.stopPropagation();
    updateMemory(m.id, { hidden: !(m.hidden ?? false) });
  };

  return (
    <>
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className={`absolute left-0 bottom-0 z-[800] flex h-[50vh] max-h-[85vh] w-full flex-col rounded-t-lg border-t border-border bg-background/95 shadow-lg backdrop-blur-[20px] transition-transform duration-300 md:bottom-auto md:top-0 md:h-full md:max-h-none md:w-[320px] md:rounded-none md:border-t-0 md:border-r ${
          sidebarOpen
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:-translate-x-full'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          maxHeight: 'calc(85vh - env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="flex flex-col gap-2 border-b border-border p-4">
          <h1 className="font-display text-xl font-semibold tracking-tight text-text-primary">
            MEMORY ATLAS<sup className="font-mono text-xs text-text-secondary"> V3</sup>
          </h1>
          <div className="h-px bg-accent/40" />
          <SearchBar />
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {memories.length === 0 && groups.length === 0 && (
            <p className="font-body py-2 text-center text-sm text-text-muted">
              No memories yet. Click the map to pin one.
            </p>
          )}
          <div className="space-y-1">
            <GroupSection
              id={UNGROUPED_ID}
              name="Ungrouped"
              memories={ungroupedMemories}
              searchQuery={searchQuery}
              collapsed={ungroupedCollapsed}
              hidden={false}
              onToggleCollapse={() => setUngroupedCollapsed((c) => !c)}
              onToggleHide={() => {}}
              onDelete={() => {}}
              onMemoryClick={handleMemoryClick}
              onMemoryToggleHide={handleMemoryToggleHide}
              isUngrouped
            />
            {groups.map((g) => (
              <GroupSection
                key={g.id}
                id={g.id}
                name={g.name}
                memories={memories.filter((m) => (m.groupId ?? null) === g.id)}
                searchQuery={searchQuery}
                collapsed={g.collapsed}
                hidden={g.hidden ?? false}
                onToggleCollapse={() => updateGroup(g.id, { collapsed: !g.collapsed })}
                onToggleHide={() => updateGroup(g.id, { hidden: !(g.hidden ?? false) })}
                onDelete={() => {
                  if (window.confirm(`Delete group "${g.name}"? Memories will move to Ungrouped.`)) {
                    removeGroup(g.id);
                  }
                }}
                onMemoryClick={handleMemoryClick}
                onMemoryToggleHide={handleMemoryToggleHide}
                isUngrouped={false}
                openForRename={openForRenameId === g.id}
                onClearOpenForRename={() => setOpenForRenameId(null)}
              />
            ))}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                createNewGroup();
              }}
              className="font-mono touch-target mt-2 flex min-h-[44px] w-full items-center gap-2 rounded-sm border border-dashed border-border py-3 pl-3 text-sm text-text-muted hover:border-accent hover:text-accent active:border-accent"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New group
            </button>
          </div>
        </div>
        <div className="border-t border-border px-4 py-3">
          <p className="font-mono text-xs text-text-secondary">
            {memories.length} MEMORIES ARCHIVED
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSidebarOpen(!sidebarOpen);
        }}
        className={`absolute left-0 top-1/2 z-[801] flex h-14 min-h-[44px] w-10 min-w-[44px] touch-target -translate-y-1/2 items-center justify-center rounded-r border border-l-0 border-border bg-surface/90 text-text-secondary backdrop-blur-sm transition-all hover:bg-surface-elevated hover:text-accent active:scale-95 md:h-12 md:w-6 ${
          sidebarOpen ? 'md:left-[320px]' : ''
        }`}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${sidebarOpen ? '' : 'rotate-180'}`}
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
    </>
  );
}
