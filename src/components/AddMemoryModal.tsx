import { useState, useCallback, useRef, useEffect } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import { compressImageToDataUrl } from '../utils/imageUtils';
import { formatCoords } from '../utils/formatCoords';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { Memory, PendingLatLng } from '../types/memory';

function generateId(): string {
  return crypto.randomUUID();
}

interface AddMemoryModalProps {
  pending: PendingLatLng | null;
  editingMemory: Memory | null;
  onClose: () => void;
}

export function AddMemoryModal({ pending, editingMemory, onClose }: AddMemoryModalProps) {
  const addMemory = useMemoryStore((s) => s.addMemory);
  const updateMemory = useMemoryStore((s) => s.updateMemory);
  const setEditingMemory = useMemoryStore((s) => s.setEditingMemory);
  const setDefaultGroupId = useMemoryStore((s) => s.setDefaultGroupId);
  const isEdit = !!editingMemory;
  const effectiveLat = editingMemory ? editingMemory.lat : pending?.lat ?? 0;
  const effectiveLng = editingMemory ? editingMemory.lng : pending?.lng ?? 0;

  const [title, setTitle] = useState(editingMemory?.title ?? '');
  const [notes, setNotes] = useState(editingMemory?.notes ?? '');
  const [date, setDate] = useState(
    () => editingMemory?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(
    editingMemory?.imageDataUrl ?? null
  );
  const defaultGroupId = useMemoryStore((s) => s.defaultGroupId);
  const [groupId, setGroupId] = useState<string | null>(
    editingMemory ? (editingMemory.groupId ?? null) : (defaultGroupId ?? null)
  );
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const groups = useMemoryStore((s) => s.groups);
  useFocusTrap(modalRef, !!(pending || editingMemory));

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file || !file.type.startsWith('image/')) {
        setUploadError('Please choose an image file.');
        return;
      }
      setUploadError(null);
      try {
        const dataUrl = await compressImageToDataUrl(file);
        setImageDataUrl(dataUrl);
      } catch {
        setUploadError('Failed to process image.');
      }
    },
    []
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file ?? null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file ?? null);
  };

  const handleSave = () => {
    const chosenGroupId = groupId || null;
    if (editingMemory) {
      updateMemory(editingMemory.id, {
        title: title.trim() || 'Untitled',
        date,
        notes: notes.trim(),
        imageDataUrl,
        groupId: chosenGroupId,
      });
      setEditingMemory(null);
    } else if (pending) {
      const memory: Memory = {
        id: generateId(),
        lat: pending.lat,
        lng: pending.lng,
        title: title.trim() || 'Untitled',
        date,
        notes: notes.trim(),
        imageDataUrl,
        createdAt: new Date().toISOString(),
        groupId: chosenGroupId,
      };
      addMemory(memory);
      if (chosenGroupId) setDefaultGroupId(chosenGroupId);
    }
    onClose();
  };

  const handleDiscard = () => {
    setTitle('');
    setNotes('');
    setDate(new Date().toISOString().slice(0, 10));
    setImageDataUrl(null);
    if (editingMemory) setEditingMemory(null);
    onClose();
  };

  const [open, setOpen] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target as Node)) {
        setGroupDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpen(true));
    });
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (!editingMemory && pending) {
      setGroupId(defaultGroupId ?? null);
    }
  }, [editingMemory, pending, defaultGroupId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!pending && !editingMemory) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[1100] bg-background/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={modalRef}
        className={`modal-slide-up fixed inset-0 z-[1101] flex flex-col bg-surface md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[90vh] md:w-full md:max-w-lg md:rounded border border-border md:shadow-xl ${open ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-4 py-6 overscroll-contain md:p-8" style={{ WebkitOverflowScrolling: 'touch' }}>
        <p className="font-mono text-sm text-accent">
          {formatCoords(effectiveLat, effectiveLng)}
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 flex min-h-[120px] aspect-video w-full cursor-pointer touch-target flex-col items-center justify-center rounded border-2 border-dashed transition-colors ${
            dragOver ? 'border-accent bg-accent-glow' : 'border-border bg-surface-elevated'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
          {imageDataUrl ? (
            <img
              src={imageDataUrl}
              alt="Preview"
              className="h-full w-full rounded object-cover"
            />
          ) : (
            <span className="font-mono text-sm text-text-muted">
              Drop photo or click to upload
            </span>
          )}
          {uploadError && (
            <p className="mt-2 font-mono text-xs text-danger">{uploadError}</p>
          )}
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name this memory..."
          className="font-display mt-6 w-full border-none bg-transparent text-xl text-text-primary placeholder-text-muted outline-none md:text-2xl"
          style={{ fontSize: 'min(1.25rem, 5vw)' }}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="font-mono mt-4 w-full max-w-[200px] min-h-[44px] touch-target border-b border-border bg-transparent py-3 text-base text-text-primary outline-none md:py-2 md:text-sm"
        />

        <div className="mt-4" ref={groupDropdownRef}>
          <label className="font-mono mb-1 block text-xs text-text-secondary">
            Group
          </label>
          <div className="relative w-full max-w-[200px]">
            <button
              type="button"
              onClick={() => setGroupDropdownOpen((o) => !o)}
              className="font-mono w-full min-h-[44px] touch-target flex items-center justify-between gap-2 border-b border-border bg-surface-elevated/50 py-3 pl-0 pr-2 text-left text-base text-text-primary outline-none transition-colors hover:bg-surface-elevated md:py-2 md:text-sm"
              aria-expanded={groupDropdownOpen}
              aria-haspopup="listbox"
              aria-label="Select group"
            >
              <span>{groupId ? groups.find((g) => g.id === groupId)?.name ?? 'Ungrouped' : 'Ungrouped'}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {groupDropdownOpen && (
              <ul
                role="listbox"
                className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded border border-border bg-surface shadow-lg"
              >
                <li role="option" aria-selected={!groupId}>
                  <button
                    type="button"
                    onClick={() => {
                      setGroupId(null);
                      setGroupDropdownOpen(false);
                    }}
                    className={`font-mono w-full min-h-[44px] touch-target px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-elevated focus:outline-none ${!groupId ? 'bg-surface-elevated text-accent' : 'text-text-primary'}`}
                  >
                    Ungrouped
                  </button>
                </li>
                {groups.map((g) => (
                  <li key={g.id} role="option" aria-selected={groupId === g.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setGroupId(g.id);
                        setGroupDropdownOpen(false);
                      }}
                      className={`font-mono w-full min-h-[44px] touch-target px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-elevated focus:outline-none ${groupId === g.id ? 'bg-surface-elevated text-accent' : 'text-text-primary'}`}
                    >
                      {g.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What happened here..."
          rows={4}
          className="font-body mt-4 w-full resize-none border-none bg-transparent text-base text-text-primary placeholder-text-muted outline-none"
        />

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="font-mono touch-target min-h-[44px] min-w-[120px] flex-1 bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 active:opacity-95 md:flex-none md:py-2.5"
          >
            {isEdit ? 'SAVE CHANGES' : 'ARCHIVE MEMORY'}
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            className="font-mono touch-target min-h-[44px] flex-1 py-3 text-sm text-text-muted transition-colors hover:text-text-secondary active:opacity-80 md:flex-none md:py-2.5"
          >
            DISCARD
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
