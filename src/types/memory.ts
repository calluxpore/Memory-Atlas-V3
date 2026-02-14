export interface Memory {
  id: string;
  lat: number;
  lng: number;
  title: string;
  date: string;
  notes: string;
  imageDataUrl: string | null;
  createdAt: string;
  /** Optional for backward compatibility with saved data; treat missing as null. */
  groupId?: string | null;
  /** When true, memory is hidden from the map (still in sidebar, greyed). */
  hidden?: boolean;
}

export interface Group {
  id: string;
  name: string;
  collapsed: boolean;
  /** When true, group and its memories are hidden from the map. */
  hidden?: boolean;
}

export interface PendingLatLng {
  lat: number;
  lng: number;
}
