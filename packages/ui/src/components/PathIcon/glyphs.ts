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
  /** Lucide `external-link`: a button that opens the browser. */
  externo: 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
  /** Lucide `shield`: the aviso de privacidad. */
  privacidad:
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
  /** Lucide `file-text`: the términos y condiciones. */
  terminos:
    'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8',
} as const;

export type GlyphName = keyof typeof GLYPHS;
