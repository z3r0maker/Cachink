import type { OperadorShellData } from './shell/types';

/** The handoff's «hoy»: every file is drawn on 14 May 2026. */
export const HOY = '2026-05-14';

/**
 * The design's example register (Taquería Don Pedro, Caja 1, Ana Robledo),
 * used until the register runtime (O-06) supplies live data.
 */
export const SHELL_FIXTURE: OperadorShellData = {
  negocio: { nombre: 'Taquería Don Pedro', iniciales: 'TP' },
  caja: 'Caja 1',
  operador: { nombre: 'Ana Robledo', iniciales: 'AR' },
  turno: { desde: '08:15' },
  connection: 'en-linea',
  pendientes: 3,
  avisosSinLeer: 2,
};
