import { useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Memory } from '../types/memory';
import { useMemoryStore } from '../store/memoryStore';

function createMarkerIcon(memory: Memory, isActive: boolean) {
  return L.divIcon({
    className: 'memory-marker-wrapper marker-enter',
    html: `
      <div class="memory-marker ${isActive ? 'active' : ''}" data-memory-id="${memory.id}">
        ${isActive ? '<div class="marker-pulse-ring"></div>' : ''}
        <div class="marker-dot" title="${escapeHtml(memory.title)}"></div>
        <div class="marker-tooltip">${escapeHtml(memory.title)}</div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

interface MemoryMarkerProps {
  memory: Memory;
  onMouseOver?: (memory: Memory, point: L.Point) => void;
  onMouseOut?: () => void;
}

export function MemoryMarker({ memory, onMouseOver, onMouseOut }: MemoryMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  const selectedMemory = useMemoryStore((s) => s.selectedMemory);
  const setSelectedMemory = useMemoryStore((s) => s.setSelectedMemory);

  const isActive = selectedMemory?.id === memory.id;

  const handleClick = (e: L.LeafletMouseEvent) => {
    e.originalEvent.stopPropagation();
    map.flyTo([memory.lat, memory.lng], map.getZoom(), { duration: 0.5 });
    setSelectedMemory(memory);
  };

  return (
    <Marker
      ref={markerRef}
      position={[memory.lat, memory.lng]}
      icon={createMarkerIcon(memory, isActive)}
      eventHandlers={{
        click: handleClick,
        mouseover: (e) => onMouseOver?.(memory, e.containerPoint),
        mouseout: () => onMouseOut?.(),
      }}
      zIndexOffset={isActive ? 1000 : 0}
    />
  );
}
