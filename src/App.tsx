import { useCallback, useEffect } from 'react';
import { useMemoryStore } from './store/memoryStore';
import { MapProvider } from './context/MapContext';
import { MapView } from './components/MapView';
import { Sidebar } from './components/Sidebar';
import { AddMemoryModal } from './components/AddMemoryModal';
import { MemoryViewer } from './components/MemoryViewer';
import { ThemeToggle } from './components/ThemeToggle';
import { LocationSearch } from './components/LocationSearch';

function AppContent() {
  const pendingLatLng = useMemoryStore((s) => s.pendingLatLng);
  const isAddingMemory = useMemoryStore((s) => s.isAddingMemory);
  const editingMemory = useMemoryStore((s) => s.editingMemory);
  const selectedMemory = useMemoryStore((s) => s.selectedMemory);
  const theme = useMemoryStore((s) => s.theme);
  const setPendingLatLng = useMemoryStore((s) => s.setPendingLatLng);
  const setIsAddingMemory = useMemoryStore((s) => s.setIsAddingMemory);
  const setEditingMemory = useMemoryStore((s) => s.setEditingMemory);
  const setSelectedMemory = useMemoryStore((s) => s.setSelectedMemory);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const showAddModal = isAddingMemory && pendingLatLng;
  const showEditModal = !!editingMemory;
  const hasOverlay = showAddModal || showEditModal || !!selectedMemory;

  useEffect(() => {
    if (hasOverlay) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.inset = '0';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.inset = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [hasOverlay]);

  const closeAddModal = useCallback(() => {
    setPendingLatLng(null);
    setIsAddingMemory(false);
  }, [setPendingLatLng, setIsAddingMemory]);

  const closeEditModal = useCallback(() => {
    setEditingMemory(null);
  }, [setEditingMemory]);

  const closeMemoryViewer = useCallback(() => {
    setSelectedMemory(null);
  }, [setSelectedMemory]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--color-map-water)]">
      <MapView />
      <Sidebar />
      <LocationSearch />
      <ThemeToggle />

      {(showAddModal || showEditModal) && (
        <AddMemoryModal
          pending={showAddModal ? pendingLatLng : null}
          editingMemory={editingMemory}
          onClose={showEditModal ? closeEditModal : closeAddModal}
        />
      )}

      {selectedMemory && (
        <MemoryViewer
          memory={selectedMemory}
          onClose={closeMemoryViewer}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <MapProvider>
      <AppContent />
    </MapProvider>
  );
}

export default App;
