/**
 * The frame's own glyphs, beside the caja's `ICONS` (`@xangarro/caja`): the
 * chevrons, the close cross, the check and the crossed-out Wi-Fi of the
 * offline notice, as the web caja draws them (`operador/ui/toast.tsx`,
 * `shell/header.tsx`). Lucide paths in a 24 × 24 box.
 */
export const GLYPHS = {
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'm9 18 6-6-6-6',
  close: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  sinRed:
    'M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M5 12.86a10 10 0 0 1 5.17-2.69M2 8.82a15 15 0 0 1 4.18-2.65M22 8.82a15 15 0 0 0-11.29-3.76M19 12.86a10 10 0 0 0-2-1.54M2 2l20 20',
  /** Lucide `refresh-ccw`: what is waiting to be sent. */
  nube: 'M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M16 16h5v5',
  /** Lucide `arrow-down-up`: cash in and out of the drawer. */
  movimientos: 'm3 16 4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16',
  /** Lucide `settings-2`: the device's own settings. */
  ajustes: 'M20 7h-9M14 17H5M17 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM7 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  /** Lucide `log-out`: the rail's «Cerrar» (the turno). */
  salir: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
} as const;

export type GlyphName = keyof typeof GLYPHS;
