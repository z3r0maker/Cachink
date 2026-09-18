/**
 * estadoDeCuenta — a client's account from its only two facts (ADR-074):
 * fiado tickets and abonos. Abonos are applied in date order, each to the
 * oldest ticket still open (`aplicarAbono`); what exceeds every ticket is
 * saldo a favor. Balance, open tickets and credit are derived, never stored.
 */

import { AbonoInvalidoError } from '../errors/cobranza-errors.js';
import { type Money, ZERO, sum } from '../money/index.js';
import { aplicarAbono } from './abonos.js';

export interface CargoFiado {
  readonly id: string;
  /** ISO date-time; orders the tickets. */
  readonly fecha: string;
  readonly monto: Money;
}

export interface PagoCliente {
  readonly id: string;
  /** ISO date-time; abonos apply in this order. */
  readonly fecha: string;
  readonly monto: Money;
}

export interface VentaEnCuenta {
  readonly id: string;
  readonly pagado: Money;
  readonly pendiente: Money;
}

export interface EstadoCuenta {
  /** Oldest first. */
  readonly ventas: readonly VentaEnCuenta[];
  readonly saldo: Money;
  readonly saldoAFavor: Money;
  /** Per abono id: the last ticket it reached, or `null` if it reached none. */
  readonly hasta: Readonly<Record<string, string | null>>;
}

const porFecha = <T extends { readonly fecha: string }>(xs: readonly T[]): T[] =>
  [...xs].sort((a, b) => a.fecha.localeCompare(b.fecha));

export function estadoDeCuenta(
  ventas: readonly CargoFiado[],
  abonos: readonly PagoCliente[],
): EstadoCuenta {
  const pagado = new Map<string, Money>();
  const hasta: Record<string, string | null> = {};
  let aFavor = ZERO;
  const ordenadas = porFecha(ventas);
  for (const a of porFecha(abonos)) {
    if (a.monto <= ZERO) throw new AbonoInvalidoError();
    const abiertas = ordenadas.map((v) => ({
      ...v,
      pendiente: v.monto - (pagado.get(v.id) ?? ZERO),
    }));
    const r = aplicarAbono(abiertas, a.monto);
    for (const x of r.aplicaciones)
      pagado.set(x.ventaId, (pagado.get(x.ventaId) ?? ZERO) + x.aplicado);
    hasta[a.id] = r.aplicaciones.at(-1)?.ventaId ?? null;
    aFavor += r.excedente;
  }
  const enCuenta = ordenadas.map((v) => {
    const p = pagado.get(v.id) ?? ZERO;
    return { id: v.id, pagado: p, pendiente: v.monto - p };
  });
  return {
    ventas: enCuenta,
    saldo: sum(enCuenta.map((v) => v.pendiente)),
    saldoAFavor: aFavor,
    hasta,
  };
}

/** What can still be sold on credit under the owner's limit. */
export const disponible = (limite: Money, saldo: Money): Money =>
  limite > saldo ? limite - saldo : ZERO;
