# Memory Atlas

A **map-based memory journal** that lets you pin life moments to places, organize them in groups, and explore them on a timeline—all in the browser, with no account required.

---

## What is this project?

**Memory Atlas** is a personal, location-aware journal. You add “memories” by clicking on a map: each memory has a title, date, notes, and an optional photo, tied to a latitude/longitude. Memories can be grouped (e.g. “Trip to Japan”, “2024”), reordered, and hidden. A sidebar lists everything; a timeline view (when enabled) draws a line connecting memories in order. Data is stored in your browser (localStorage) via Zustand persist—private and offline-capable.

---

## What it does

- **Map-based journaling** — Click anywhere on the map to add a memory at that location. Edit or delete from the sidebar or by opening a memory.
- **Groups** — Create groups, assign memories to them, collapse/expand and reorder. Drag-and-drop to reorder memories within a group.
- **Timeline** — Toggle a polyline on the map that connects memories in sidebar order (by group and order), so you can see a “path” through your memories.
- **Search** — Filter memories by title, notes, or date. Search can highlight a point or area on the map.
- **Photos** — Attach one image per memory (stored as compressed data URLs).
- **Light/dark theme** — UI and map tiles (e.g. CartoDB) switch with your preference.
- **Responsive** — Sidebar and controls adapt to smaller screens; map remains central.
- **Persistence** — Memories and groups are saved in the browser; no backend or login.

---

## Why it’s important

- **Place and time together** — Many journals are either date-based or tag-based. Memory Atlas ties entries to real geography, so you can see *where* things happened and how places relate.
- **Privacy-first** — Everything stays in your browser. No sign-up, no server storing your data, no tracking.
- **Simple and focused** — No social features or clutter; it’s a single-user tool for reflecting on places and moments.
- **Reusable and hackable** — Built with standard web tech (React, TypeScript, Leaflet, Vite), so you can run it locally, deploy to GitHub Pages, or extend it for your own use.

---
 
## How it’s built

### Stack

- **React 19** + **TypeScript** — UI and type-safe state.
- **Vite 7** — Dev server, HMR, and production builds.
- **Zustand** — Global state (memories, groups, UI flags) with `persist` middleware for localStorage.
- **Leaflet** + **react-leaflet** — Interactive map; **react-leaflet-cluster** for marker clustering when zoomed out.
- **Tailwind CSS 4** — Styling and theming (CSS variables for light/dark).
- **No backend** — All data in the client; optional deploy to static hosting (e.g. GitHub Pages).

### Project structure (high level)

- `src/`
  - `App.tsx` — Root layout, modals (add/edit memory, memory viewer), theme and overlay behavior.
  - `components/` — `MapView`, `Sidebar`, `AddMemoryModal`, `MemoryViewer`, `MemoryMarker`, `MemoryHoverCard`, `LocationSearch`, `SearchBar`, `ConfirmDialog`, `ThemeToggle`, `TimelineToggle`, `ErrorBoundary`, etc.
  - `store/memoryStore.ts` — Zustand store: memories, groups, selection, search, theme, timeline toggle, persistence config.
  - `context/MapContext.tsx` — React context holding the Leaflet map instance for programmatic control (e.g. flyTo for search).
  - `types/memory.ts` — `Memory`, `Group`, `PendingLatLng`.
  - `utils/` — `formatDate`, `formatCoords`, `memoryOrder`, `memoryLabel`, `timelineCurve`, `imageUtils`, etc.
  - `hooks/` — `useFocusTrap`, `useMediaQuery`, etc.
- `public/` — Static assets (e.g. 404 page for SPA routing on GitHub Pages).
- `scripts/copy-to-docs.cjs` — Optional script to copy build output to `docs/` for branch-based GitHub Pages.
- **Base path** — Vite is configured with `base: '/Memory-Atlas/'` for GitHub Pages repo deployment.

### Run and build

```bash
npm install
npm run dev      # Development
npm run build    # Production build (output in dist/)
npm run preview  # Preview production build locally
```

### Electron (desktop app)

You can run Memory Atlas as a desktop app and build installers for Windows (and, with the same setup, macOS/Linux):

```bash
npm run electron:dev   # Dev: Vite + Electron window (with DevTools)
npm run electron:build # Build: outputs in release/
```

After `electron:build` you get:

- **release/win-unpacked/** — Unpacked app (run `Memory Atlas.exe` to test).
- **release/Memory Atlas Setup 1.0.0.exe** — NSIS installer (download and install).
- **release/Memory Atlas 1.0.0.exe** — Portable executable (no install).

Web and Electron share the same codebase; the Electron build uses `base: './'` and skips the PWA plugin.

---

## Deploy to GitHub Pages

**Recommended: GitHub Actions**

1. In the repo go to **Settings** → **Pages** → under **Build and deployment**, set **Source** to **GitHub Actions**. Save.
2. Push the repo (including `.github/workflows/deploy-pages.yml`) to `main`. The workflow will build the app and deploy to GitHub Pages.
3. After the action completes (see the **Actions** tab), open:  
   `https://<your-username>.github.io/Memory-Atlas/`

Each push to `main` will rebuild and redeploy. You don’t need to run `build:pages` or commit the `docs` folder.

**Manual alternative:** Run `npm run build:pages`, commit and push the `docs` folder, then in **Settings** → **Pages** set Source to **Deploy from a branch** → Branch: **main** → Folder: **/docs**.
