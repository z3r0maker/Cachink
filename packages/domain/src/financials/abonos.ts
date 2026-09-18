/**
 * aplicarAbono — how a client's abono settles their fiado tickets (ADR-074).
 *
 * An abono belongs to the client, not to a sale. It is applied to the oldest
 * open ticket first, then the next, until it runs out. Money beyond the whole
 * balance is not applied: it comes back as `excedente` for the caller to turn
 * into saldo a favor or hand back. Pure; nothing stores a balance.
 */

import { AbonoInvalidoError } from '../errors/cobranza-errors.js';
import { type Money, ZERO, sum } from '../money/index.js';

export interface VentaAbierta {
  readonly id: string;
  /** ISO date of the sale; the oldest is settled first. */
  readonly fecha: string;
  /** What is still owed on it, in centavos. */
  readonly pendiente: Money;
}

export interface Aplicacion {
  readonly ventaId: string;
  readonly aplicado: Money;
  /** The ticket is fully paid after this abono. */
  readonly completa: boolean;
}

export interface AplicacionAbono {
  readonly aplicaciones: readonly Aplicacion[];
  readonly aplicado: Money;
  /** Balance still owed after the abono. */
  readonly restante: Money;
  /** Part of the abono beyond the whole balance. */
  readonly excedente: Money;
}

export function aplicarAbono(abiertas: readonly VentaAbierta[], monto: Money): AplicacionAbono {
  if (monto <= ZERO) throw new AbonoInvalidoError();
  const pendientes = abiertas
    .filter((v) => v.pendiente > ZERO)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const aplicaciones: Aplicacion[] = [];
  let resto = monto;
  for (const v of pendientes) {
    if (resto <= ZERO) break;
    const aplicado = resto < v.pendiente ? resto : v.pendiente;
    aplicaciones.push({ ventaId: v.id, aplicado, completa: aplicado === v.pendiente });
    resto -= aplicado;
  }
  const aplicado = monto - resto;
  return {
    aplicaciones,
    aplicado,
    restante: sum(pendientes.map((v) => v.pendiente)) - aplicado,
    excedente: resto,
  };
}
