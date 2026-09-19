/** The day-one saldo (C-20): older than every ticket, paid by abonos first. */
export type SaldoInicial = Money;

/**
 * estadoDeCuenta — a client's account from its only facts (ADR-074 + C-20):
 * an optional opening saldo, fiado tickets and abonos. Abonos are applied in
 * date order, each to the opening saldo first (it predates every ticket),
 * then to the oldest ticket still open (`aplicarAbono`); what exceeds both is
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
  saldoInicial: SaldoInicial = ZERO,
): EstadoCuenta {
  const pagado = new Map<string, Money>();
  const hasta: Record<string, string | null> = {};
  let aFavor = ZERO;
  let apertura = saldoInicial;
  const ordenadas = porFecha(ventas);
  for (const a of porFecha(abonos)) {
    if (a.monto <= ZERO) throw new AbonoInvalidoError();
    // The opening saldo is the oldest debt there is: this abono pays it
    // before any ticket, and only its remainder reaches the tickets.
    // (`saldoInicial` is a debt: the caller validates it is ≥ 0 — an opening
    // saldo a favor is not a receivable and is refused upstream, C-20.)
    const aTickets = apertura >= a.monto ? ZERO : a.monto - apertura;
    apertura -= a.monto - aTickets;
    if (aTickets === ZERO) {
      // The whole abono stayed on the opening saldo; no ticket was reached.
      hasta[a.id] = null;
      continue;
    }
    const abiertas = ordenadas.map((v) => ({
      ...v,
      pendiente: v.monto - (pagado.get(v.id) ?? ZERO),
    }));
    const r = aplicarAbono(abiertas, aTickets);
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
    saldo: apertura + sum(enCuenta.map((v) => v.pendiente)),
    saldoAFavor: aFavor,
    hasta,
  };
}

/** What can still be sold on credit under the owner's limit. */
export const disponible = (limite: Money, saldo: Money): Money =>
  limite > saldo ? limite - saldo : ZERO;
