import type { Memory } from '../types/memory';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

interface MemoryHoverCardProps {
  memory: Memory;
  point: { x: number; y: number };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function MemoryHoverCard({
  memory,
  point,
  onMouseEnter,
  onMouseLeave,
}: MemoryHoverCardProps) {
  const notesPreview = memory.notes?.trim()
    ? memory.notes.trim().slice(0, 80) + (memory.notes.length > 80 ? '…' : '')
    : null;

  return (
    <div
      className="memory-hover-card pointer-events-auto absolute z-[850] w-56 rounded border border-border bg-surface shadow-lg"
      style={{
        left: point.x,
        top: point.y,
        transform: 'translate(-50%, calc(-100% - 10px))',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {memory.imageDataUrl && (
        <div className="h-24 w-full overflow-hidden rounded-t">
          <img
            src={memory.imageDataUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-3">
        <h3 className="font-display text-sm font-semibold text-text-primary line-clamp-2">
          {memory.title || 'Untitled'}
        </h3>
        <p className="font-mono mt-0.5 text-xs text-text-secondary">
          {formatDate(memory.date)}
        </p>
        {notesPreview && (
          <p className="font-body mt-1.5 text-xs text-text-muted line-clamp-2">
            {notesPreview}
          </p>
        )}
      </div>
    </div>
  );
}
