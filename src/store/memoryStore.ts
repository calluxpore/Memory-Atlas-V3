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
  selectedMemory: Memory | null;
  editingMemory: Memory | null;
  isAddingMemory: boolean;
  pendingLatLng: PendingLatLng | null;
  searchHighlight: SearchHighlight;
  sidebarOpen: boolean;
  searchQuery: string;
  theme: 'dark' | 'light';
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
  setDefaultGroupId: (id: string | null) => void;
  addGroup: (group: Group) => void;
  removeGroup: (id: string) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      memories: [],
      groups: [],
      selectedMemory: null,
      editingMemory: null,
      isAddingMemory: false,
      pendingLatLng: null,
      searchHighlight: null,
      sidebarOpen: true,
      searchQuery: '',
      theme: 'dark',
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
          selectedMemory:
            state.selectedMemory?.id === id
              ? { ...state.selectedMemory, ...updates }
              : state.selectedMemory,
        })),

      removeMemory: (id) =>
        set((state) => ({
          memories: state.memories.filter((m) => m.id !== id),
          selectedMemory: state.selectedMemory?.id === id ? null : state.selectedMemory,
        })),

      setSelectedMemory: (selectedMemory) => set({ selectedMemory }),

      setTheme: (theme) => set({ theme }),

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

      setEditingMemory: (editingMemory) => set({ editingMemory }),

      setIsAddingMemory: (isAddingMemory) => set({ isAddingMemory }),

      setPendingLatLng: (pendingLatLng) => set({ pendingLatLng }),

      setSearchHighlight: (searchHighlight) => set({ searchHighlight }),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),
    }),
    {
      name: 'memory-atlas-storage',
      partialize: (state) => ({
        memories: state.memories,
        groups: state.groups,
        theme: state.theme,
        defaultGroupId: state.defaultGroupId,
      }),
    }
  )
);
