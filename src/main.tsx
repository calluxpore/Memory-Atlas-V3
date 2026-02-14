import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'

// Apply persisted theme before first paint to avoid flash
try {
  const raw = localStorage.getItem('memory-atlas-storage')
  if (raw) {
    const { state } = JSON.parse(raw) as { state?: { theme?: string } }
    if (state?.theme === 'light') document.documentElement.dataset.theme = 'light'
  }
} catch { /* ignore */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
