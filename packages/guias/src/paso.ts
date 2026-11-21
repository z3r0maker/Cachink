import type { Paso } from './guia.js';

/**
 * A step of a caja guide: what it says on screen, what Don Cuentas says, and
 * the control it is about when its test flow names one.
 */
export const paso = (texto: string, voz: string, control?: string): Paso =>
  control === undefined ? { texto, voz } : { texto, voz, control };

/** What every caja guide shares. None is public until its page exists (ADR-163). */
export const DE_CAJA = { superficie: 'caja', minutos: 1, publica: false } as const;
