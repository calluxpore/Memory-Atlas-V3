import { useRef, useMemo } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Memory } from '../types/memory';
import { useMemoryStore } from '../store/memoryStore';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createMarkerIcon(memory: Memory, isActive: boolean, label: string | undefined) {
  const markerInner = `
    <div class="memory-marker ${isActive ? 'active' : ''}" data-memory-id="${memory.id}">
      ${isActive ? '<div class="marker-pulse-ring"></div>' : ''}
      <div class="marker-dot" title="${escapeHtml(memory.title)}"></div>
      <div class="marker-tooltip">${escapeHtml(memory.title)}</div>
    </div>
  `;
  const hasLabel = label != null && label !== '';
  const html = hasLabel
    ? `<div class="memory-marker-outer">
         <div class="memory-marker-label">${escapeHtml(label)}</div>
         ${markerInner}
       </div>`
    : markerInner;
  return L.divIcon({
    className: 'memory-marker-wrapper marker-enter',
    html,
    iconSize: hasLabel ? [24, 36] : [24, 24],
    iconAnchor: hasLabel ? [12, 24] : [12, 12],
  });
}

interface MemoryMarkerProps {
  memory: Memory;
  /** Label shown above the node (e.g. A, B, A1). */
  label?: string;
  onMouseOver?: (memory: Memory, point: L.Point) => void;
  onMouseOut?: () => void;
}

export function MemoryMarker({ memory, label, onMouseOver, onMouseOut }: MemoryMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  const isActive = useMemoryStore((s) => s.selectedMemoryId === memory.id);
  const setSelectedMemory = useMemoryStore((s) => s.setSelectedMemory);

  const icon = useMemo(
    () => createMarkerIcon(memory, isActive, label),
    [memory.id, memory.title, isActive, label]
  );

  const handleClick = (e: L.LeafletMouseEvent) => {
    e.originalEvent.stopPropagation();
    map.flyTo([memory.lat, memory.lng], map.getZoom(), { duration: 0.5 });
    setSelectedMemory(memory);
  };

  return (
    <Marker
      ref={markerRef}
      position={[memory.lat, memory.lng]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
        mouseover: (e) => onMouseOver?.(memory, e.containerPoint),
        mouseout: () => onMouseOut?.(),
      }}
      zIndexOffset={isActive ? 1000 : 0}
    />
  );
}
