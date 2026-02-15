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
  /** Order within group (or ungrouped). Lower = first. Used for sidebar and map label order. */
  order?: number;
  /** Custom icon/emoji label (1–3 chars). When set, overrides the default A/B/C label on sidebar and map. */
  customLabel?: string | null;
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
