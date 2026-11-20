/** The package drawer's two icons (board CD-10d): a file and a download. */
const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function IconoArchivo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="2.2" {...trazo}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function IconoDescargar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2.6" {...trazo}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
