/**
 * How the entry screens name the day and the caja, from the session (El
 * Mostrador §11: never a literal «Caja 1»). Pure.
 */
import { fechaInicio } from '@xangarro/caja/inicio';

/** «Jueves 14 de mayo»: Inicio's date without the caja part. */
export function diaLargo(ahora: Date): string {
  return fechaInicio(ahora, null, '').split(' · ')[0] ?? '';
}

/** «Caja 1 · Taquería Don Pedro»; either half alone; null when neither is known. */
export function contextoCaja(caja: string | null, negocio: string | null): string | null {
  const partes = [caja, negocio].filter((p): p is string => p !== null && p.trim() !== '');
  return partes.length === 0 ? null : partes.join(' · ');
}
