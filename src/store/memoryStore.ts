import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  editingMemory: Memory | null;
  isAddingMemory: boolean;
  pendingLatLng: PendingLatLng | null;
  searchHighlight: SearchHighlight;
  sidebarOpen: boolean;
  searchQuery: string;
  theme: 'dark' | 'light';
  timelineEnabled: boolean;
  defaultGroupId: string | null;
  setMemories: (memories: Memory[]) => void;
  addMemory: (memory: Memory) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  removeMemory: (id: string) => void;
  setSelectedMemory: (memory: Memory | null) => void;
  setEditingMemory: (memory: Memory | null) => void;
  setIsAddingMemory: (value: boolean) => void;
  setPendingLatLng: (value: PendingLatLng | null) => void;
  setSearchHighlight: (value: SearchHighlight) => void;
  setSidebarOpen: (value: boolean) => void;
  setSearchQuery: (value: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setTimelineEnabled: (value: boolean) => void;
  setDefaultGroupId: (id: string | null) => void;
  addGroup: (group: Group) => void;
  removeGroup: (id: string) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  /** Set order of memories within a group (or ungrouped when groupId is null). orderedMemoryIds = full list in desired order. */
  reorderMemoriesInGroup: (groupId: string | null, orderedMemoryIds: string[]) => void;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      memories: [],
      groups: [],
      selectedMemoryId: null,
      editingMemory: null,
      isAddingMemory: false,
      pendingLatLng: null,
      searchHighlight: null,
      sidebarOpen: true,
      searchQuery: '',
      theme: 'dark',
      timelineEnabled: false,
      defaultGroupId: null,

      setMemories: (memories) => set({ memories }),

      addMemory: (memory) =>
        set((state) => ({
          memories: [...state.memories, memory],
          isAddingMemory: false,
          pendingLatLng: null,
        })),

      updateMemory: (id, updates) =>
        set((state) => ({
          memories: state.memories.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      removeMemory: (id) =>
        set((state) => ({
          memories: state.memories.filter((m) => m.id !== id),
          selectedMemoryId: state.selectedMemoryId === id ? null : state.selectedMemoryId,
        })),

      setSelectedMemory: (memory) =>
        set({ selectedMemoryId: memory?.id ?? null }),

      setTheme: (theme) => set({ theme }),

      setTimelineEnabled: (timelineEnabled) => set({ timelineEnabled }),

      setDefaultGroupId: (defaultGroupId) => set({ defaultGroupId }),

      addGroup: (group) =>
        set((state) => ({
          groups: [...state.groups, group],
          defaultGroupId: group.id,
        })),

      removeGroup: (id) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
          memories: state.memories.map((m) =>
            m.groupId === id ? { ...m, groupId: null } : m
          ),
          defaultGroupId: state.defaultGroupId === id ? null : state.defaultGroupId,
        })),

      updateGroup: (id, updates) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),

      reorderMemoriesInGroup: (groupId, orderedMemoryIds) =>
        set((state) => {
          const updates = new Map<string, number>();
          orderedMemoryIds.forEach((id, index) => updates.set(id, index));
          return {
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
    }),
    {
      name: 'memory-atlas-storage',
      version: 1,
      partialize: (state) => ({
        memories: state.memories,
        groups: state.groups,
        theme: state.theme,
        defaultGroupId: state.defaultGroupId,
      }),
      migrate: (persisted: unknown, version: number) => {
        if (persisted == null || typeof persisted !== 'object') return persisted as Record<string, unknown>;
        const p = persisted as Record<string, unknown>;
        if (version < 1) {
          return {
            memories: Array.isArray(p.memories) ? p.memories : [],
            groups: Array.isArray(p.groups) ? p.groups : [],
            theme: p.theme === 'light' ? 'light' : 'dark',
            defaultGroupId: p.defaultGroupId ?? null,
          } as Record<string, unknown>;
        }
        return persisted as Record<string, unknown>;
      },
    }
  )
);
