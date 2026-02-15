import { useRef, useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Rectangle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMemoryStore } from '../store/memoryStore';
import { MemoryMarker } from './MemoryMarker';
import { MemoryHoverCard } from './MemoryHoverCard';
import { SetMapRef } from './SetMapRef';
import type { Memory } from '../types/memory';
import type { SearchHighlight } from '../store/memoryStore';

function ZoomControlPlacement() {
  const map = useMap();
  useEffect(() => {
    const zoom = L.control.zoom({ position: 'bottomright' });
    zoom.addTo(map);
    return () => {
      map.removeControl(zoom);
    };
  }, [map]);
  return null;
}

const pendingPulseIcon = L.divIcon({
  className: 'pending-pulse-wrapper',
  html: '<div class="marker-pulse-ring"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Fix default icon 404s when using react-leaflet (optional, we use divIcon only)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TILE_URL_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_URL_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

function MapClickHandler({
  onMapClick,
  onMapMouseMove,
  onMapDragStart,
  onMapZoomStart,
  mapBlurred,
}: {
  onMapClick: (latlng: L.LatLng) => void;
  onMapMouseMove?: (e: L.LeafletMouseEvent) => void;
  onMapDragStart?: () => void;
  onMapZoomStart?: () => void;
  mapBlurred: boolean;
}) {
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useMapEvents({
    click(e) {
      const target = e.originalEvent?.target as HTMLElement | undefined;
      if (target?.closest?.('.leaflet-control-container')) return;
      setRipple({ x: e.containerPoint.x, y: e.containerPoint.y });
      onMapClick(e.latlng);
      setTimeout(() => setRipple(null), 650);
    },
    mousemove: (e) => onMapMouseMove?.(e),
    dragstart: () => onMapDragStart?.(),
    zoomstart: () => onMapZoomStart?.(),
    mouseover: () => {
      hoverTimeoutRef.current = setTimeout(() => setHoverTooltip(true), 1000);
    },
    mouseout: () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setHoverTooltip(false);
    },
  });

  return (
    <>
      {ripple && (
        <div
          className="map-click-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 20,
            height: 20,
            marginLeft: -10,
            marginTop: -10,
          }}
        />
      )}
      {hoverTooltip && !mapBlurred && (
        <div
          className="pointer-events-none fixed z-[1000] font-mono text-[10px] tracking-widest text-accent opacity-90"
          style={{
            left: '50%',
            bottom: '5.5rem',
            transform: 'translateX(-50%)',
          }}
        >
          CLICK TO PIN MEMORY
        </div>
      )}
    </>
  );
}

const SEARCH_HIGHLIGHT_BLUE = '#3b82f6';

function MapContent({
  memories,
  pendingLatLng,
  searchHighlight,
  mapBlurred,
  onMapClick,
  onMapMouseMove,
  onMapDragStart,
  onMapZoomStart,
  visibleMemoryIds,
  onMarkerHover,
  onMarkerHoverOut,
}: {
  memories: Memory[];
  pendingLatLng: { lat: number; lng: number } | null;
  searchHighlight: SearchHighlight;
  mapBlurred: boolean;
  onMapClick: (latlng: L.LatLng) => void;
  onMapMouseMove?: (e: L.LeafletMouseEvent) => void;
  onMapDragStart?: () => void;
  onMapZoomStart?: () => void;
  visibleMemoryIds: Set<string>;
  onMarkerHover: (memory: Memory, point: L.Point) => void;
  onMarkerHoverOut: () => void;
}) {
  const visible = memories.filter((m) => visibleMemoryIds.has(m.id));
  return (
    <>
      <MapClickHandler
        onMapClick={onMapClick}
        onMapMouseMove={onMapMouseMove}
        onMapDragStart={onMapDragStart}
        onMapZoomStart={onMapZoomStart}
        mapBlurred={mapBlurred}
      />
      {searchHighlight?.type === 'point' && (
        <CircleMarker
          center={[searchHighlight.lat, searchHighlight.lng]}
          radius={10}
          pathOptions={{
            color: SEARCH_HIGHLIGHT_BLUE,
            fillColor: SEARCH_HIGHLIGHT_BLUE,
            fillOpacity: 0.9,
            weight: 2,
            interactive: false,
          }}
          zIndexOffset={400}
        />
      )}
      {searchHighlight?.type === 'area' && (
        <Rectangle
          bounds={[
            [searchHighlight.bbox[0], searchHighlight.bbox[2]],
            [searchHighlight.bbox[1], searchHighlight.bbox[3]],
          ]}
          pathOptions={{
            color: SEARCH_HIGHLIGHT_BLUE,
            fillColor: SEARCH_HIGHLIGHT_BLUE,
            fillOpacity: 0.25,
            weight: 2,
            dashArray: '8 6',
            interactive: false,
          }}
          zIndexOffset={400}
        />
      )}
      {pendingLatLng && (
        <Marker
          position={[pendingLatLng.lat, pendingLatLng.lng]}
          icon={pendingPulseIcon}
          zIndexOffset={500}
          interactive={false}
        />
      )}
      {visible.map((m) => (
        <MemoryMarker
          key={m.id}
          memory={m}
          onMouseOver={onMarkerHover}
          onMouseOut={onMarkerHoverOut}
        />
      ))}
    </>
  );
}

const HOVER_HIDE_DELAY_MS = 150;

function usePrefersHover() {
  const [prefersHover, setPrefersHover] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(hover: hover)').matches : false
  );
  useEffect(() => {
    const m = window.matchMedia('(hover: hover)');
    setPrefersHover(m.matches);
    const fn = () => setPrefersHover(m.matches);
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, []);
  return prefersHover;
}

export function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const hoverHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredMemory, setHoveredMemory] = useState<Memory | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
  const prefersHover = usePrefersHover();

  const memories = useMemoryStore((s) => s.memories);
  const groups = useMemoryStore((s) => s.groups);
  const theme = useMemoryStore((s) => s.theme);
  const pendingLatLng = useMemoryStore((s) => s.pendingLatLng);
  const searchHighlight = useMemoryStore((s) => s.searchHighlight);
  const isAddingMemory = useMemoryStore((s) => s.isAddingMemory);
  const setPendingLatLng = useMemoryStore((s) => s.setPendingLatLng);
  const setSearchHighlight = useMemoryStore((s) => s.setSearchHighlight);
  const setIsAddingMemory = useMemoryStore((s) => s.setIsAddingMemory);

  const mapBlurred = isAddingMemory;
  const hiddenGroupIds = new Set(
    groups.filter((g) => g.hidden).map((g) => g.id)
  );
  const visibleMemoryIds = new Set(
    memories
      .filter((m) => !(m.hidden ?? false))
      .filter((m) => {
        const gid = m.groupId ?? null;
        return gid === null || !hiddenGroupIds.has(gid);
      })
      .map((m) => m.id)
  );
  const tileUrl = theme === 'light' ? TILE_URL_LIGHT : TILE_URL_DARK;

  const closeHoverCard = useCallback(() => {
    if (hoverHideTimeoutRef.current) {
      clearTimeout(hoverHideTimeoutRef.current);
      hoverHideTimeoutRef.current = null;
    }
    setHoveredMemory(null);
    setHoverPoint(null);
  }, []);

  const onMapClick = useCallback(
    (latlng: L.LatLng) => {
      closeHoverCard();
      setSearchHighlight(null);
      setPendingLatLng({ lat: latlng.lat, lng: latlng.lng });
      setIsAddingMemory(true);
    },
    [closeHoverCard, setSearchHighlight, setPendingLatLng, setIsAddingMemory]
  );

  const onMarkerHover = useCallback(
    (memory: Memory, point: L.Point) => {
      if (!prefersHover) return;
      if (hoverHideTimeoutRef.current) {
        clearTimeout(hoverHideTimeoutRef.current);
        hoverHideTimeoutRef.current = null;
      }
      setHoveredMemory(memory);
      setHoverPoint({ x: point.x, y: point.y });
    },
    [prefersHover]
  );

  const onMarkerHoverOut = useCallback(() => {
    hoverHideTimeoutRef.current = setTimeout(() => {
      setHoveredMemory(null);
      setHoverPoint(null);
      hoverHideTimeoutRef.current = null;
    }, HOVER_HIDE_DELAY_MS);
  }, []);

  const onMapMouseMove = useCallback((e: L.LeafletMouseEvent) => {
    const target = e.originalEvent?.target as HTMLElement | undefined;
    if (!target?.closest?.('.memory-marker-wrapper')) {
      if (hoverHideTimeoutRef.current) clearTimeout(hoverHideTimeoutRef.current);
      hoverHideTimeoutRef.current = setTimeout(() => {
        setHoveredMemory(null);
        setHoverPoint(null);
        hoverHideTimeoutRef.current = null;
      }, HOVER_HIDE_DELAY_MS);
    }
  }, []);

  const onMapDragStart = useCallback(() => closeHoverCard(), [closeHoverCard]);
  const onMapZoomStart = useCallback(() => closeHoverCard(), [closeHoverCard]);

  const onCardMouseEnter = useCallback(() => {
    if (hoverHideTimeoutRef.current) {
      clearTimeout(hoverHideTimeoutRef.current);
      hoverHideTimeoutRef.current = null;
    }
  }, []);

  const onCardMouseLeave = useCallback(() => {
    setHoveredMemory(null);
    setHoverPoint(null);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverHideTimeoutRef.current) clearTimeout(hoverHideTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`absolute inset-0 transition-[filter] duration-300 ${
        mapBlurred ? 'filter blur-[4px]' : ''
      }`}
    >
      <MapContainer
        ref={(r) => {
          mapRef.current = r ?? null;
        }}
        center={[43.6532, -79.3832]}
        zoom={11}
        className="h-full w-full animate-map-in opacity-0"
        style={{ cursor: 'crosshair' }}
        zoomControl={false}
      >
        <SetMapRef />
        <ZoomControlPlacement />
        <TileLayer url={tileUrl} />
        <MapContent
          memories={memories}
          pendingLatLng={pendingLatLng}
          searchHighlight={searchHighlight}
          mapBlurred={mapBlurred}
          onMapClick={onMapClick}
          onMapMouseMove={onMapMouseMove}
          onMapDragStart={onMapDragStart}
          onMapZoomStart={onMapZoomStart}
          visibleMemoryIds={visibleMemoryIds}
          onMarkerHover={onMarkerHover}
          onMarkerHoverOut={onMarkerHoverOut}
        />
      </MapContainer>
      {prefersHover && hoveredMemory && hoverPoint && (
        <MemoryHoverCard
          memory={hoveredMemory}
          point={hoverPoint}
          onMouseEnter={onCardMouseEnter}
          onMouseLeave={onCardMouseLeave}
        />
      )}
    </div>
  );
}
