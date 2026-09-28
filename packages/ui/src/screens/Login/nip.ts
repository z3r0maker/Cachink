/**
 * The NIP as the keypad builds it (ADR-072: exactly four digits). Pure, so
 * Acceso and Bloqueo share one rule and the tests need no screen.
 */
import { PIN_LENGTH } from '@xangarro/domain';

export type TeclaNip = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'borrar';

/** One key: a digit appends while there is room, «Borrar» drops the last. */
export function teclearNip(nip: string, tecla: TeclaNip): string {
  if (tecla === 'borrar') return nip.slice(0, -1);
  return nip.length >= PIN_LENGTH ? nip : `${nip}${tecla}`;
}

export const nipCompleto = (nip: string): boolean => nip.length === PIN_LENGTH;

/** «Ana Robledo» → «Ana». */
export const primerNombreDe = (nombre: string): string => nombre.trim().split(/\s+/)[0] ?? nombre;
