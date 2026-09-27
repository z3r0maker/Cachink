/**
 * The caja's routes and the design files' `ICON` table: the hrefs the read
 * models put on tasks and avisos, and the glyphs they name. Both apps draw
 * the same paths.
 */
export const OPERADOR_BASE = '/operador';

export const ICONS = {
  inicio: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10',
  caja: 'M4 4h16v16H4V4Zm4 4h8M8 12h3m5 0h.01M8 16h3m5 0h.01',
  turno: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
  ventas: 'M3 6h2l2.4 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 9H6',
  gastos: 'M12 3v14M6 11l6 6 6-6M4 21h16',
  inventario: 'M4 8l8-4 8 4v8l-8 4-8-4V8Zm8-4v20M4 8l8 4 8-4',
  cobranza: 'M4 6h16v12H4V6Zm3 12v2m10-2v2M8 12h8',
  /** Lucide `user-plus`: a person with a plus, for fiado and abonos. */
  fiado:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  /** Lucide `lock`: the design's `<rect x=4 y=11 w=16 h=10 rx=2>` as a path. */
  lock: 'M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2ZM8 11V7a4 4 0 0 1 8 0v4',
} as const;
