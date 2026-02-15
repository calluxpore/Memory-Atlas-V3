import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useMapRef } from '../context/MapContext';
import { useIsMd } from '../hooks/useMediaQuery';
import { useMemoryStore } from '../store/memoryStore';
import { SearchBar } from './SearchBar';
import { ConfirmDialog } from './ConfirmDialog';
import { compareOrderThenCreatedAt, memoriesInSidebarOrder } from '../utils/memoryOrder';
import { formatDate } from '../utils/formatDate';
import { getMemoryLabel } from '../utils/memoryLabel';
import type { Memory } from '../types/memory';

const UNGROUPED_ID = '__ungrouped__';

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

const DRAG_MEMORY_KEY = 'memory-id';
const DROP_LINE_END = '__drop_end__';

/** Insert draggedId so it appears before beforeId, or at end if beforeId is null. */
function insertBefore(ids: string[], draggedId: string, beforeId: string | null): string[] {
  const without = ids.filter((id) => id !== draggedId);
  if (beforeId === null) return [...without, draggedId];
  const idx = without.indexOf(beforeId);
  if (idx === -1) return ids;
  return [...without.slice(0, idx), draggedId, ...without.slice(idx)];
}

/** Thin drop target between list items; shows a line when dragging over (same group). */
function ReorderDropLine({
  insertBeforeId,
  lineId,
  isActive,
  isSameGroup,
  memoryIds,
  onReorderMemories,
  onDragOverLine,
  onDragLeaveLine,
}: {
  insertBeforeId: string | null;
  lineId: string;
  isActive: boolean;
  isSameGroup: boolean;
  memoryIds: string[];
  onReorderMemories: (orderedIds: string[]) => void;
  onDragOverLine: (id: string) => void;
  onDragLeaveLine: () => void;
}) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (isSameGroup) onDragOverLine(lineId);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData(DRAG_MEMORY_KEY) || e.dataTransfer.getData('text/plain');
    if (!id || !memoryIds.includes(id)) return;
    onReorderMemories(insertBefore(memoryIds, id, insertBeforeId));
  };

  return (
    <div
      role="presentation"
      className={`reorder-drop-line flex-shrink-0 ${isActive && isSameGroup ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeaveLine}
      onDrop={handleDrop}
      aria-hidden
    />
  );
}

const CUSTOM_LABEL_MAX_LENGTH = 3;

function MemoryListItem({
  memory,
  searchQuery,
  label,
  onLabelChange,
  onClick,
  onToggleHide,
  onDelete,
  onDragStartWithId,
}: {
  memory: Memory;
  searchQuery: string;
  /** Default letter label (A, B, …) when no customLabel. */
  label?: string;
  onLabelChange?: (memoryId: string, value: string | null) => void;
  onClick: (e: React.MouseEvent) => void;
  onToggleHide: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onDragStartWithId?: (memoryId: string) => void;
}) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [editValue, setEditValue] = useState(memory.customLabel ?? '');
  const isHidden = memory.hidden ?? false;
  const displayLabel = (memory.customLabel?.trim() || null) ?? label ?? '';
  const effectiveLabel = displayLabel || label || '';

  const handleLabelBlur = () => {
    setEditingLabel(false);
    const v = editValue.trim() || null;
    if (v !== (memory.customLabel ?? null)) onLabelChange?.(memory.id, v);
  };

  return (
    <div className="group/mem flex w-full min-h-[28px] touch-target items-center gap-0 rounded-sm border-l-2 border-transparent py-0.5 pl-0 pr-0.5 transition-colors hover:bg-surface-elevated hover:border-accent/50 active:bg-surface-elevated">
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(DRAG_MEMORY_KEY, memory.id);
          e.dataTransfer.setData('text/plain', memory.id);
          e.dataTransfer.effectAllowed = 'move';
          onDragStartWithId?.(memory.id);
        }}
        className="flex-shrink-0 flex min-h-[32px] min-w-[32px] cursor-grab active:cursor-grabbing items-center justify-center p-1.5 text-text-muted opacity-60 group-hover/mem:opacity-100"
        aria-hidden
        title="Drag to reorder"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>
      {label != null && (
        <div className="flex-shrink-0 mr-1.5 flex h-6 w-6 items-center justify-center rounded bg-surface-elevated">
          {editingLabel ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value.slice(0, CUSTOM_LABEL_MAX_LENGTH))}
              onBlur={handleLabelBlur}
              onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget.blur(), handleLabelBlur())}
              className="h-full w-full rounded bg-surface text-center text-sm text-text-primary outline-none ring-1 ring-accent"
              maxLength={CUSTOM_LABEL_MAX_LENGTH}
              autoFocus
              aria-label="Edit icon or emoji"
            />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditValue(memory.customLabel ?? '');
                setEditingLabel(true);
              }}
              className="flex h-full w-full items-center justify-center rounded text-sm text-text-secondary transition-colors hover:bg-surface hover:text-accent"
              title="Click to set emoji or icon"
              aria-label="Edit icon or emoji"
            >
              {effectiveLabel}
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className={`flex min-h-[28px] min-w-0 flex-1 touch-target items-center gap-1.5 py-0.5 pl-1 text-left ${isHidden ? 'opacity-50' : ''}`}
      >
        <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded bg-surface-elevated">
          {memory.imageDataUrl ? (
            <img
              src={memory.imageDataUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-muted font-mono text-[10px]">
              —
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-text-primary truncate text-[11px] font-medium leading-tight">
            {highlightMatch(memory.title || 'Untitled', searchQuery)}
          </div>
          <div className="font-mono text-[10px] text-text-secondary leading-tight">
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
        className="flex-shrink-0 touch-target min-h-[28px] min-w-[28px] p-1 text-text-muted hover:text-accent active:text-accent"
        aria-label={isHidden ? 'Show on map' : 'Hide from map'}
        title={isHidden ? 'Show on map' : 'Hide from map'}
      >
        {isHidden ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24 4.24" />
            <path d="M1 1l22 22" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          className="flex-shrink-0 touch-target min-h-[28px] min-w-[28px] p-1 text-text-muted hover:text-danger"
          aria-label="Delete memory"
          title="Delete memory"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      )}
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
  onMemoryDelete,
  onMemoryLabelChange,
  onDropMemory,
  onReorderMemories,
  isUngrouped,
  memoryLabels,
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
  onMemoryDelete?: (e: React.MouseEvent, m: Memory) => void;
  onMemoryLabelChange?: (memoryId: string, value: string | null) => void;
  onDropMemory: (memoryId: string) => void;
  onReorderMemories: (orderedMemoryIds: string[]) => void;
  isUngrouped: boolean;
  memoryLabels?: Map<string, string>;
  openForRename?: boolean;
  onClearOpenForRename?: () => void;
}) {
  const [editingName, setEditingName] = useState(!!openForRename);
  const [editValue, setEditValue] = useState(name);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isListDragOver, setIsListDragOver] = useState(false);
  const [draggedMemoryId, setDraggedMemoryId] = useState<string | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const [activeDropLineId, setActiveDropLineId] = useState<string | null>(null);
  const updateGroup = useMemoryStore((s) => s.updateGroup);
  const memoryIds = memories.map((m) => m.id);
  const isSameGroupDrag =
    memoryIds.includes(draggedMemoryId ?? '') || memoryIds.includes(draggedIdRef.current ?? '');
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

  const handleHeaderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsListDragOver(false);
    const memoryId = e.dataTransfer.getData(DRAG_MEMORY_KEY);
    if (memoryId) onDropMemory(memoryId);
  };

  const handleListDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (e.dataTransfer.types.includes(DRAG_MEMORY_KEY)) setIsListDragOver(true);
  };

  const handleListDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsListDragOver(false);
    const memoryId = e.dataTransfer.getData(DRAG_MEMORY_KEY);
    if (memoryId && !memoryIds.includes(memoryId)) onDropMemory(memoryId);
  };

  const handleListDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsListDragOver(false);
  };

  const isHidden = hidden ?? false;
  return (
    <div className={`py-0 ${isHidden ? 'opacity-70' : ''}`}>
      <div
        className={`flex items-center gap-1 rounded-sm border transition-colors ${isDragOver ? 'border-accent bg-accent-glow' : 'border-transparent hover:border-border'}`}
        onClick={(e) => e.stopPropagation()}
        onDragOver={handleHeaderDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="touch-target flex min-h-[28px] min-w-[28px] flex-shrink-0 items-center justify-center p-1 text-text-muted hover:text-text-primary"
          aria-label={collapsed ? 'Expand group' : 'Collapse group'}
        >
          <svg
            width="10"
            height="10"
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
            className="font-mono flex-1 bg-transparent py-0 text-[11px] text-text-primary outline-none"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => !isUngrouped && setEditingName(true)}
            className="font-mono flex-1 truncate py-0 text-left text-[11px] font-medium text-text-secondary"
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
              className="touch-target flex min-h-[28px] min-w-[28px] flex-shrink-0 items-center justify-center p-1 text-text-muted hover:text-accent"
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
              className="touch-target flex min-h-[28px] min-w-[28px] flex-shrink-0 items-center justify-center p-1 text-text-muted hover:text-danger"
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
        <div
          className={`ml-1 mt-0 min-h-[24px] space-y-0 rounded-r border-l border-border pl-1 transition-colors ${isListDragOver ? 'bg-accent-glow' : ''}`}
          onDragOver={handleListDragOver}
          onDragLeave={handleListDragLeave}
          onDrop={handleListDrop}
          onDragEnd={() => {
            setDraggedMemoryId(null);
            draggedIdRef.current = null;
            setActiveDropLineId(null);
            setIsListDragOver(false);
          }}
        >
          {memories.map((m) => (
            <div
              key={m.id}
              className={`transition-opacity duration-200 ${
                memoryMatchesSearch(m, searchQuery) ? 'opacity-100' : 'opacity-20'
              }`}
            >
              <ReorderDropLine
                insertBeforeId={m.id}
                lineId={m.id}
                isActive={activeDropLineId === m.id}
                isSameGroup={isSameGroupDrag}
                memoryIds={memoryIds}
                onReorderMemories={onReorderMemories}
                onDragOverLine={setActiveDropLineId}
                onDragLeaveLine={() => setActiveDropLineId(null)}
              />
              <MemoryListItem
                memory={m}
                searchQuery={searchQuery}
                label={memoryLabels?.get(m.id)}
                onLabelChange={onMemoryLabelChange}
                onClick={(e) => onMemoryClick(e, m)}
                onToggleHide={(e) => onMemoryToggleHide(e, m)}
                onDelete={onMemoryDelete ? (e) => onMemoryDelete(e, m) : undefined}
                onDragStartWithId={(id) => {
                  draggedIdRef.current = id;
                  setDraggedMemoryId(id);
                }}
              />
            </div>
          ))}
          <ReorderDropLine
            insertBeforeId={null}
            lineId={DROP_LINE_END}
            isActive={activeDropLineId === DROP_LINE_END}
            isSameGroup={isSameGroupDrag}
            memoryIds={memoryIds}
            onReorderMemories={onReorderMemories}
            onDragOverLine={setActiveDropLineId}
            onDragLeaveLine={() => setActiveDropLineId(null)}
          />
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
  const sidebarWidth = useMemoryStore((s) => s.sidebarWidth);
  const setSidebarWidth = useMemoryStore((s) => s.setSidebarWidth);
  const isMd = useIsMd();
  const setCardTargetMemoryId = useMemoryStore((s) => s.setCardTargetMemoryId);
  const addGroup = useMemoryStore((s) => s.addGroup);
  const removeGroup = useMemoryStore((s) => s.removeGroup);
  const updateGroup = useMemoryStore((s) => s.updateGroup);
  const updateMemory = useMemoryStore((s) => s.updateMemory);
  const reorderMemoriesInGroup = useMemoryStore((s) => s.reorderMemoriesInGroup);
  const panelRef = useRef<HTMLDivElement>(null);
  const [ungroupedCollapsed, setUngroupedCollapsed] = useState(false);
  const [openForRenameId, setOpenForRenameId] = useState<string | null>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<{ id: string; name: string } | null>(null);
  const [confirmDeleteMemory, setConfirmDeleteMemory] = useState<{ id: string; name: string } | null>(null);
  const [resizing, setResizing] = useState(false);
  const resizeStartRef = useRef({ clientX: 0, width: 0 });
  const removeMemory = useMemoryStore((s) => s.removeMemory);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizeStartRef.current = { clientX: e.clientX, width: sidebarWidth };
      setResizing(true);
    },
    [sidebarWidth]
  );

  useEffect(() => {
    if (!resizing) return;
    const minW = 240;
    const maxW = 560;
    const onMove = (e: MouseEvent) => {
      const { clientX, width } = resizeStartRef.current;
      setSidebarWidth(Math.min(maxW, Math.max(minW, width + (e.clientX - clientX))));
    };
    const onUp = () => {
      setResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizing, setSidebarWidth]);

  const handleMemoryClick = useCallback(
    (e: React.MouseEvent, memory: Memory) => {
      e.stopPropagation();
      e.preventDefault();
      setCardTargetMemoryId(memory.id);
      if (map) {
        map.flyTo([memory.lat, memory.lng], 12, { duration: 0.5 });
      }
    },
    [map, setCardTargetMemoryId]
  );

  const handleMemoryToggleHide = useCallback(
    (e: React.MouseEvent, m: Memory) => {
      e.stopPropagation();
      updateMemory(m.id, { hidden: !(m.hidden ?? false) });
    },
    [updateMemory]
  );

  const handleMemoryDelete = useCallback((e: React.MouseEvent, m: Memory) => {
    e.stopPropagation();
    setConfirmDeleteMemory({ id: m.id, name: m.title || 'Untitled' });
  }, []);

  const handleMemoryLabelChange = useCallback(
    (memoryId: string, value: string | null) => {
      updateMemory(memoryId, { customLabel: value || undefined });
    },
    [updateMemory]
  );

  const memoryLabels = useMemo(() => {
    const sorted = memoriesInSidebarOrder(memories, groups);
    return new Map(sorted.map((m, i) => [m.id, getMemoryLabel(i)]));
  }, [memories, groups]);
  const ungroupedMemories = memories
    .filter((m) => !(m.groupId ?? null))
    .sort(compareOrderThenCreatedAt);
  const createNewGroup = () => {
    const id = crypto.randomUUID();
    addGroup({
      id,
      name: 'New group',
      collapsed: false,
    });
    setOpenForRenameId(id);
  };

  return (
    <>
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className={`absolute left-0 top-0 z-[800] flex h-full min-h-full w-[85vw] max-w-[320px] flex-row border-r border-border bg-background/95 shadow-lg backdrop-blur-[20px] transition-transform duration-300 md:max-w-none ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          ...(isMd ? { width: sidebarWidth } : undefined),
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-col gap-1 border-b border-border p-2">
          <div className="flex items-center gap-1">
            <h1 className="font-display min-w-0 flex-1 text-base font-semibold tracking-tight text-text-primary">
              MEMORY ATLAS<sup className="font-mono text-[10px] text-text-secondary"> V3</sup>
            </h1>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
              className="touch-target flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-border bg-surface/80 text-text-secondary transition-colors hover:bg-surface-elevated hover:text-accent active:scale-95"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${sidebarOpen ? '' : 'rotate-180'}`}
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
          <div className="h-px bg-accent/40" />
          <SearchBar />
        </div>
        <div className="flex-1 overflow-y-auto px-1.5 py-1">
          {memories.length === 0 && groups.length === 0 && (
            <p className="font-body py-1 text-center text-[11px] text-text-muted">
              No memories yet. Click the map to pin one.
            </p>
          )}
          <div className="space-y-0.5">
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
              onMemoryDelete={handleMemoryDelete}
              onMemoryLabelChange={handleMemoryLabelChange}
              onDropMemory={(memoryId) => updateMemory(memoryId, { groupId: null })}
              onReorderMemories={(orderedIds) => reorderMemoriesInGroup(null, orderedIds)}
              isUngrouped
              memoryLabels={memoryLabels}
            />
            {groups.map((g) => (
              <GroupSection
                key={g.id}
                id={g.id}
                name={g.name}
                memories={memories
                  .filter((m) => (m.groupId ?? null) === g.id)
                  .sort(compareOrderThenCreatedAt)}
                searchQuery={searchQuery}
                collapsed={g.collapsed}
                hidden={g.hidden ?? false}
                onToggleCollapse={() => updateGroup(g.id, { collapsed: !g.collapsed })}
                onToggleHide={() => updateGroup(g.id, { hidden: !(g.hidden ?? false) })}
                onDelete={() => setConfirmDeleteGroup({ id: g.id, name: g.name })}
                onMemoryClick={handleMemoryClick}
                onMemoryToggleHide={handleMemoryToggleHide}
                onMemoryDelete={handleMemoryDelete}
                onMemoryLabelChange={handleMemoryLabelChange}
                onDropMemory={(memoryId) => updateMemory(memoryId, { groupId: g.id })}
                onReorderMemories={(orderedIds) => reorderMemoriesInGroup(g.id, orderedIds)}
                isUngrouped={false}
                memoryLabels={memoryLabels}
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
              className="font-mono touch-target mt-1 flex min-h-[28px] w-full items-center gap-1 rounded-sm border border-dashed border-border py-1.5 pl-1.5 text-[11px] text-text-muted hover:border-accent hover:text-accent active:border-accent"
            >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New group
          </button>
          </div>
        </div>
        <div className="border-t border-border px-2 py-1.5">
          <p className="font-mono text-[10px] text-text-secondary">
            {memories.length} MEMORIES ARCHIVED
          </p>
        </div>
        </div>
        {isMd && sidebarOpen && (
          <div
            role="separator"
            aria-label="Resize sidebar"
            onMouseDown={handleResizeStart}
            className="flex w-2 flex-shrink-0 cursor-col-resize items-stretch border-r border-transparent bg-transparent hover:border-accent/50 active:bg-accent/20"
          />
        )}
      </div>
      {!sidebarOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen(true);
          }}
          className="absolute left-4 z-[801] flex h-9 w-9 items-center justify-center rounded border border-border bg-surface/90 text-text-secondary backdrop-blur-sm transition-colors hover:bg-surface-elevated hover:text-accent active:scale-95"
          style={{ top: 'max(1rem, env(safe-area-inset-top, 0px))' }}
          aria-label="Open sidebar"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rotate-180">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      <ConfirmDialog
        open={!!confirmDeleteGroup}
        title="Delete group"
        message={confirmDeleteGroup ? `Delete group "${confirmDeleteGroup.name}"? Memories will move to Ungrouped.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={() => {
          if (confirmDeleteGroup) {
            removeGroup(confirmDeleteGroup.id);
            setConfirmDeleteGroup(null);
          }
        }}
        onCancel={() => setConfirmDeleteGroup(null)}
      />
      <ConfirmDialog
        open={!!confirmDeleteMemory}
        title="Delete memory"
        message={confirmDeleteMemory ? `Delete "${confirmDeleteMemory.name}" from the atlas?` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={() => {
          if (confirmDeleteMemory) {
            removeMemory(confirmDeleteMemory.id);
            setConfirmDeleteMemory(null);
          }
        }}
        onCancel={() => setConfirmDeleteMemory(null)}
      />
    </>
  );
}
