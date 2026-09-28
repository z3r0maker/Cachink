/** Lucide-shaped stroke icons for Sincronización's record tiles and cajas. */
const base = {
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function IconoInventario() {
  return (
    <svg {...base}>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <polyline points="3.29 7 12 12 20.71 7" />
    </svg>
  );
}

export function IconoTicket() {
  return (
    <svg {...base}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6" />
    </svg>
  );
}

export function IconoCaja() {
  return (
    <svg {...base} strokeWidth={2}>
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

export function IconoWifi() {
  return (
    <svg {...base} width={14} height={14}>
      <path d="M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.859a10 10 0 0 1 14 0M8.5 16.429a5 5 0 0 1 7 0" />
    </svg>
  );
}

/** A clock turning back: Historial's empty state (DS-03). */
export function IconoHistorial() {
  return (
    <svg {...base} width={22} height={22} strokeWidth={2}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
