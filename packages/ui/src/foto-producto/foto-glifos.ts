/**
 * The photo boards' strokes (MvFoto*), copied from the canvas: the camera on
 * the tile's badge and the hint, the gallery, the torch, the bin of «Quitar
 * foto», the arrow of the confirmation. One `d` each, for `PathIcon`.
 */
export const FOTO_GLIFOS = {
  camara:
    'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM15 13a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
  galeria:
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 9a2 2 0 1 1-4 0a2 2 0 1 1 4 0M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21',
  linterna:
    'M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12zM6 6h12M12 12v.01',
  basura: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  flecha: 'M5 12h14M12 5l7 7-7 7',
  info: 'M22 12a10 10 0 1 1-20 0a10 10 0 1 1 20 0M12 16v-4M12 8h.01',
} as const;
