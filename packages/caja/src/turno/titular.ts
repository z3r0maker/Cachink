/**
 * One open turno per caja (M-18, ADR-071 §3; board MvTurnoDeOtro). When
 * someone signs in while another person's turno is open, the phone says
 * whose it is and offers to continue it or count and close it; continuing,
 * Mi turno names who opened it. Names go by their first word («Ana
 * Robledo» → «Ana»), and a blank one never leaves a stray comma.
 */

import { formatMoney, type Money } from '@xangarro/domain';

const primero = (nombre: string): string => nombre.trim().split(/\s+/)[0] ?? '';

/** The screen right after the newcomer's NIP. */
export const TURNO_DE_OTRO = {
  titulo: (titular: string): string => {
    const n = primero(titular);
    return n === '' ? 'El turno anterior sigue abierto' : `El turno de ${n} sigue abierto`;
  },
  detalle: (desde: string, fondo: Money, ventas: number): string =>
    `Desde las ${desde} · fondo ${formatMoney(fondo)} · ${ventas === 1 ? '1 venta' : `${ventas} ventas`}`,
  cuerpo: (operador: string, titular: string): string => {
    const op = primero(operador);
    const t = primero(titular);
    const quien = op === '' ? '' : `, ${op}`;
    const cual = t === '' ? 'este' : `el de ${t}`;
    return `En esta caja va un turno a la vez${quien}. Sigue con ${cual} o ciérralo y abre el tuyo.`;
  },
  seguir: (titular: string): string => {
    const t = primero(titular);
    return t === '' ? 'Seguir con este turno' : `Seguir con el turno de ${t}`;
  },
  seguirHint: 'Lo que vendas se suma a este turno. Quien lo cierre cuenta toda la caja.',
  cerrar: (titular: string): string => {
    const t = primero(titular);
    return t === '' ? 'Cerrar este turno' : `Cerrar el turno de ${t}`;
  },
  cerrarHint: 'Cuentas la caja y cierras su corte. Después abres tu turno con lo que contaste.',
  seguirCta: 'Seguir con este turno',
  cerrarCta: (titular: string): string => {
    const t = primero(titular);
    return t === '' ? 'Contar y cerrar este turno' : `Contar y cerrar el turno de ${t}`;
  },
  volver: (operador: string): string => {
    const op = primero(operador);
    return op === '' ? 'Volver' : `No soy ${op}, volver`;
  },
} as const;

/** Mi turno's line while continuing someone else's turno. */
export const sigueElTurnoDe = (titular: string, desde: string): string =>
  `Sigues el turno de ${primero(titular)}. Lo abrió a las ${desde}.`;

/** Under «Fondo de caja»: who counted it. */
export const notaFondo = (titular: string | undefined): string => {
  const t = primero(titular ?? '');
  return t === '' ? 'con el que abriste' : `con el que abrió ${t}`;
};
