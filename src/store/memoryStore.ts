import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../utils/idbStorage';
import type { Memory, PendingLatLng, Group } from '../types/memory';

/** [south, north, west, east] */
export type SearchHighlightBbox = [number, number, number, number];

export type SearchHighlight =
  | { type: 'point'; lat: number; lng: number }
  | { type: 'area'; bbox: SearchHighlightBbox }
  | null;

interface MemoryState {
  memories: Memory[];
  groups: Group[];
  selectedMemoryId: string | null;
  /** When set, map will show the hover card for this memory after flying to it (e.g. from sidebar). */
  cardTargetMemoryId: string | null;
  editingMemory: Memory | null;
  isAddingMemory: boolean;
  pendingLatLng: PendingLatLng | null;
  searchHighlight: SearchHighlight;
  sidebarOpen: boolean;
  searchQuery: string;
  theme: 'dark' | 'light';
  timelineEnabled: boolean;
  defaultGroupId: string | null;
  /** Resizable sidebar width in px (min 240, max 560). */
  sidebarWidth: number;
  /** When true, sidebar and map show only starred memories. */
  filterStarred: boolean;
  /** Sidebar list sort: 'default' = order/createdAt, else sort by this field. */
  sortBy: 'default' | 'date' | 'title' | 'location' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  /** Map/sidebar date filter: only show memories with date in [dateFilterFrom, dateFilterTo] (YYYY-MM-DD). */
  dateFilterFrom: string | null;
  dateFilterTo: string | null;
  /** Show heatmap layer on map. */
  heatmapEnabled: boolean;
  /** Show memory markers and labels on map. */
  markersVisible: boolean;
  /** Sidebar main view: 'list' | 'calendar' | 'stats'. */
  sidebarView: 'list' | 'calendar' | 'stats';
  /** Bulk selection: memory IDs. */
  selectedMemoryIds: string[];
  /** Undo stack (snapshots of { memories, groups }). */
  undoStack: { memories: Memory[]; groups: Group[] }[];
  redoStack: { memories: Memory[]; groups: Group[] }[];
  setMemories: (memories: Memory[]) => void;
  setGroups: (groups: Group[]) => void;
  setFilterStarred: (value: boolean) => void;
  setSortBy: (sortBy: MemoryState['sortBy']) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  setDateFilter: (from: string | null, to: string | null) => void;
  setHeatmapEnabled: (value: boolean) => void;
  setMarkersVisible: (value: boolean) => void;
  setSidebarView: (view: MemoryState['sidebarView']) => void;
  addMemory: (memory: Memory) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  removeMemory: (id: string) => void;
  setSelectedMemory: (memory: Memory | null) => void;
  setCardTargetMemoryId: (id: string | null) => void;
  setEditingMemory: (memory: Memory | null) => void;
  setIsAddingMemory: (value: boolean) => void;
  setPendingLatLng: (value: PendingLatLng | null) => void;
  setSearchHighlight: (value: SearchHighlight) => void;
  setSidebarOpen: (value: boolean) => void;
  setSearchQuery: (value: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setTimelineEnabled: (value: boolean) => void;
  setDefaultGroupId: (id: string | null) => void;
  setSidebarWidth: (width: number) => void;
  addGroup: (group: Group) => void;
  removeGroup: (id: string) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  /** Set order of memories within a group (or ungrouped when groupId is null). orderedMemoryIds = full list in desired order. */
  reorderMemoriesInGroup: (groupId: string | null, orderedMemoryIds: string[]) => void;
  toggleSelection: (id: string) => void;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
  bulkDelete: (ids: string[]) => void;
  bulkMoveToGroup: (ids: string[], groupId: string | null) => void;
  undo: () => void;
  redo: () => void;
  pushUndo: () => void;
}

const UNDO_STACK_CAP = 20;

/** Strip base64 image data from memories for undo snapshots to avoid unbounded memory. */
function stripImagesForUndoSnapshot(memories: Memory[]): Memory[] {
  return memories.map((m) => ({
    ...m,
    imageDataUrl: undefined,
    imageDataUrls: undefined,
  }));
}

/** Restore image data from current state into restored memories (by id) so undo/redo doesn't lose images. */
function mergeImagesIntoRestored(restored: Memory[], current: Memory[]): Memory[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  return restored.map((r) => {
    const cur = byId.get(r.id);
    if (!cur || (cur.imageDataUrl == null && !cur.imageDataUrls?.length)) return r;
    return { ...r, imageDataUrl: cur.imageDataUrl, imageDataUrls: cur.imageDataUrls };
  });
}

const pushUndoInSet = (state: MemoryState): Partial<MemoryState> => ({
  undoStack: state.undoStack.length >= UNDO_STACK_CAP
    ? [
        ...state.undoStack.slice(1),
        { memories: stripImagesForUndoSnapshot(state.memories), groups: state.groups },
      ]
    : [...state.undoStack, { memories: stripImagesForUndoSnapshot(state.memories), groups: state.groups }],
  redoStack: [],
});

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      memories: [],
      groups: [],
      selectedMemoryId: null,
      cardTargetMemoryId: null,
      editingMemory: null,
      isAddingMemory: false,
      pendingLatLng: null,
      searchHighlight: null,
      sidebarOpen: true,
      searchQuery: '',
      theme: 'dark',
      timelineEnabled: false,
      defaultGroupId: null,
      sidebarWidth: 320,
      filterStarred: false,
      sortBy: 'default',
      sortOrder: 'asc',
      dateFilterFrom: null,
      dateFilterTo: null,
      heatmapEnabled: false,
      markersVisible: true,
      sidebarView: 'list',
      selectedMemoryIds: [],
      undoStack: [],
      redoStack: [],

      setMemories: (memories) => set({ memories }),
      setGroups: (groups) => set({ groups }),
      setFilterStarred: (filterStarred) => set({ filterStarred }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      setDateFilter: (dateFilterFrom, dateFilterTo) => set({ dateFilterFrom, dateFilterTo }),
      setHeatmapEnabled: (heatmapEnabled) => set({ heatmapEnabled }),
      setMarkersVisible: (markersVisible) => set({ markersVisible }),
      setSidebarView: (sidebarView) => set({ sidebarView }),

      setSidebarWidth: (width) =>
        set({
          sidebarWidth: Math.min(560, Math.max(240, width)),
        }),

      addMemory: (memory) =>
        set((state) => ({
          ...pushUndoInSet(state),
          memories: [...state.memories, memory],
          isAddingMemory: false,
          pendingLatLng: null,
        })),

      updateMemory: (id, updates) =>
        set((state) => ({
          ...pushUndoInSet(state),
          memories: state.memories.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      removeMemory: (id) =>
        set((state) => ({
          ...pushUndoInSet(state),
          memories: state.memories.filter((m) => m.id !== id),
          selectedMemoryId: state.selectedMemoryId === id ? null : state.selectedMemoryId,
        })),

      setSelectedMemory: (memory) =>
        set({ selectedMemoryId: memory?.id ?? null }),

      setCardTargetMemoryId: (id) => set({ cardTargetMemoryId: id }),

      setTheme: (theme) => set({ theme }),

      setTimelineEnabled: (timelineEnabled) => set({ timelineEnabled }),

      setDefaultGroupId: (defaultGroupId) => set({ defaultGroupId }),

      addGroup: (group) =>
        set((state) => ({
          ...pushUndoInSet(state),
          groups: [...state.groups, group],
          defaultGroupId: group.id,
        })),

      removeGroup: (id) =>
        set((state) => ({
          ...pushUndoInSet(state),
          groups: state.groups.filter((g) => g.id !== id),
          memories: state.memories.map((m) =>
            m.groupId === id ? { ...m, groupId: null } : m
          ),
          defaultGroupId: state.defaultGroupId === id ? null : state.defaultGroupId,
        })),

      updateGroup: (id, updates) =>
        set((state) => ({
          ...pushUndoInSet(state),
          groups: state.groups.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),

      reorderMemoriesInGroup: (groupId, orderedMemoryIds) =>
        set((state) => {
          const updates = new Map<string, number>();
          orderedMemoryIds.forEach((id, index) => updates.set(id, index));
          return {
            ...pushUndoInSet(state),
            memories: state.memories.map((m) => {
              const g = m.groupId ?? null;
              if (g !== groupId) return m;
              const order = updates.get(m.id);
              return order === undefined ? m : { ...m, order };
            }),
          };
        }),

      setEditingMemory: (editingMemory) => set({ editingMemory }),

      setIsAddingMemory: (isAddingMemory) => set({ isAddingMemory }),

      setPendingLatLng: (pendingLatLng) => set({ pendingLatLng }),

      setSearchHighlight: (searchHighlight) => set({ searchHighlight }),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      pushUndo: () =>
        set((state) => pushUndoInSet(state)),

      undo: () =>
        set((state) => {
          const last = state.undoStack[state.undoStack.length - 1];
          if (!last) return state;
          const memories = mergeImagesIntoRestored(last.memories, state.memories);
          return {
            memories,
            groups: last.groups,
            undoStack: state.undoStack.slice(0, -1),
            redoStack: [
              ...state.redoStack,
              { memories: stripImagesForUndoSnapshot(state.memories), groups: state.groups },
            ],
          };
        }),

      redo: () =>
        set((state) => {
          const next = state.redoStack[state.redoStack.length - 1];
          if (!next) return state;
          const memories = mergeImagesIntoRestored(next.memories, state.memories);
          return {
            memories,
            groups: next.groups,
            undoStack: [
              ...state.undoStack,
              { memories: stripImagesForUndoSnapshot(state.memories), groups: state.groups },
            ],
            redoStack: state.redoStack.slice(0, -1),
          };
        }),

      toggleSelection: (id) =>
        set((state) => ({
          selectedMemoryIds: state.selectedMemoryIds.includes(id)
            ? state.selectedMemoryIds.filter((x) => x !== id)
            : [...state.selectedMemoryIds, id],
        })),

      setSelection: (ids) => set({ selectedMemoryIds: ids }),

      clearSelection: () => set({ selectedMemoryIds: [] }),

      bulkDelete: (ids) =>
        set((state) => {
          const idSet = new Set(ids);
          return {
            ...pushUndoInSet(state),
            memories: state.memories.filter((m) => !idSet.has(m.id)),
            selectedMemoryId: state.selectedMemoryId && idSet.has(state.selectedMemoryId) ? null : state.selectedMemoryId,
            selectedMemoryIds: [],
          };
        }),

      bulkMoveToGroup: (ids, groupId) =>
        set((state) => {
          const idSet = new Set(ids);
          return {
            ...pushUndoInSet(state),
            memories: state.memories.map((m) =>
              idSet.has(m.id) ? { ...m, groupId } : m
            ),
            selectedMemoryIds: [],
          };
        }),
    }),
    {
      name: 'memory-atlas-storage',
      version: 2,
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        memories: state.memories,
        groups: state.groups,
        theme: state.theme,
        defaultGroupId: state.defaultGroupId,
        sidebarWidth: state.sidebarWidth,
      }),
      migrate: (persisted: unknown, version: number) => {
        if (persisted == null || typeof persisted !== 'object') return persisted as Record<string, unknown>;
        const p = persisted as Record<string, unknown>;
        if (version < 1) {
          return {
            ...p,
            memories: Array.isArray(p.memories) ? p.memories : [],
            groups: Array.isArray(p.groups) ? p.groups : [],
            theme: p.theme === 'light' ? 'light' : 'dark',
            defaultGroupId: p.defaultGroupId ?? null,
            sidebarWidth: 320,
          } as Record<string, unknown>;
        }
        if (version < 2 && p.sidebarWidth == null) {
          return { ...p, sidebarWidth: 320 } as Record<string, unknown>;
        }
        return persisted as Record<string, unknown>;
      },
    }
  )
);
