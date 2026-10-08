/**
 * What Registros por enviar decides on the phone (MvPendientes): the phase
 * from the sync state and the queue, each kind's glyph, tint and colour (the
 * web's `lista.tsx`), and the amounts inside a sentence set apart. Pure.
 */
import type { Fase, RegistroEnCola } from '@xangarro/caja/pendientes';
import { colors } from '../../theme';

const RECIBO =
  'M4 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM12 17V7M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8';
const SALIDA = 'M12 3v12M7 10l5 5 5-5M4 21h16';
const ENTRADA = 'M12 21V9M7 14l5-5 5 5M4 3h16';
const MOVER = 'M7 7h13l-4-4M17 17H4l4 4';

export const TIPO: Readonly<
  Record<
    RegistroEnCola['tipo'],
    { readonly tint: string; readonly icon: string; readonly color: string; readonly signo: string }
  >
> = {
  venta: { tint: colors.greenSoft, icon: RECIBO, color: colors.greenText, signo: '' },
  gasto: { tint: colors.redSoft, icon: SALIDA, color: colors.redText, signo: '−' },
  abono: { tint: colors.greenSoft, icon: ENTRADA, color: colors.greenText, signo: '' },
  movimiento: { tint: colors.blueSoft, icon: MOVER, color: colors.blueText, signo: '' },
};

/** Sending while a sync runs; otherwise retrying on a busy or slow server (DS-05), waiting, or everything sent. */
export function faseDe(
  syncing: boolean,
  cola: readonly RegistroEnCola[],
  reintentando = false,
): Fase {
  if (syncing) return 'enviando';
  if (cola.length === 0) return 'enviado';
  return reintentando ? 'reintentando' : 'espera';
}

/** «Suman $283.00 de ventas…» → the plain and the money parts, in order. */
export function partesConCifras(texto: string): readonly { texto: string; cifra: boolean }[] {
  return texto
    .split(/(\$[\d,]+\.\d{2})/)
    .filter((t) => t !== '')
    .map((t) => ({ texto: t, cifra: /^\$[\d,]+\.\d{2}$/.test(t) }));
}
