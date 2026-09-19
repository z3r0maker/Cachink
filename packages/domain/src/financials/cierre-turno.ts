/**
 * The turno's cash close (ADR-074 §3–4). One calculator for the expected cash:
 *
 *   esperado = fondo + ventas en efectivo + abonos en efectivo − gastos de caja
 *
 * Fiado is excluded by construction: only cash inputs exist. The count is per
 * denomination (the JSON column on `caja_turnos`), in whole pieces.
 */

import { CorteInvalidoError } from '../errors/caja-errors.js';
import { type Money, ZERO, sum } from '../money/index.js';

export interface EsperadoTurnoInput {
  readonly fondo: Money;
  readonly ventasEfectivo: readonly Money[];
  readonly abonosEfectivo: readonly Money[];
  readonly gastosCaja: readonly Money[];
}

function noNegativos(nombre: string, montos: readonly Money[]): void {
  if (montos.some((m) => m < ZERO)) throw new CorteInvalidoError(`${nombre} negativo`);
}

export function efectivoEsperado(i: EsperadoTurnoInput): Money {
  noNegativos('fondo', [i.fondo]);
  noNegativos('venta en efectivo', i.ventasEfectivo);
  noNegativos('abono en efectivo', i.abonosEfectivo);
  noNegativos('gasto de caja', i.gastosCaja);
  return i.fondo + sum(i.ventasEfectivo) + sum(i.abonosEfectivo) - sum(i.gastosCaja);
}

/**
 * The turno's expected cash from its own rows (O-03): fondo + adicional +
 * this turno's standing Efectivo tickets + Efectivo abonos − this turno's
 * gastos. Fiado, other turnos and cancelled tickets are excluded by the
 * scoping itself — `cajaTurnoId` decides, never a date range.
 */
export function esperadoDelTurno(
  turno: {
    readonly id: string;
    readonly montoAperturaCentavos: Money;
    readonly efectivoAdicionalCentavos: Money;
  },
  tickets: readonly {
    readonly id: string;
    readonly cajaTurnoId: string | null;
    readonly metodo: string;
    readonly estadoPago: string;
    readonly cancelledAt: string | null;
    readonly deletedAt: string | null;
  }[],
  lineas: readonly {
    readonly ticketId: string;
    readonly monto: Money;
    readonly deletedAt: string | null;
  }[],
  abonos: readonly {
    readonly metodo: string;
    readonly montoCentavos: Money;
    readonly deletedAt: string | null;
  }[],
  gastos: readonly {
    readonly cajaTurnoId: string | null;
    readonly monto: Money;
    readonly deletedAt: string | null;
  }[],
): Money {
  if (!turno.id) throw new CorteInvalidoError('turno sin id');
  return efectivoEsperado({
    fondo: turno.montoAperturaCentavos + turno.efectivoAdicionalCentavos,
    ventasEfectivo: ventasEfectivoDelTurno(turno, tickets, lineas),
    abonosEfectivo: abonos
      .filter((a) => a.deletedAt === null && a.metodo === 'Efectivo')
      .map((a) => a.montoCentavos),
    gastosCaja: delTurno(turno, gastos).map((g) => g.monto),
  });
}

/** Rows that belong to `turno` and are still alive. */
function delTurno<
  T extends { readonly cajaTurnoId: string | null; readonly deletedAt: string | null },
>(turno: { readonly id: string }, rows: readonly T[]): readonly T[] {
  return rows.filter((r) => r.cajaTurnoId === turno.id && r.deletedAt === null);
}

/** This turno's standing Efectivo tickets' line amounts. */
function ventasEfectivoDelTurno(
  turno: { readonly id: string },
  tickets: readonly {
    readonly id: string;
    readonly cajaTurnoId: string | null;
    readonly metodo: string;
    readonly cancelledAt: string | null;
    readonly deletedAt: string | null;
  }[],
  lineas: readonly {
    readonly ticketId: string;
    readonly monto: Money;
    readonly deletedAt: string | null;
  }[],
): readonly Money[] {
  const ids = new Set(
    delTurno(turno, tickets)
      .filter((t) => t.cancelledAt === null && t.metodo === 'Efectivo')
      .map((t) => t.id),
  );
  return lineas.filter((l) => ids.has(l.ticketId) && l.deletedAt === null).map((l) => l.monto);
}

export const DENOMINACIONES_MXN = [
  { pesos: 1000, valor: 1000_00n, tipo: 'billete' },
  { pesos: 500, valor: 500_00n, tipo: 'billete' },
  { pesos: 200, valor: 200_00n, tipo: 'billete' },
  { pesos: 100, valor: 100_00n, tipo: 'billete' },
  { pesos: 50, valor: 50_00n, tipo: 'billete' },
  { pesos: 20, valor: 20_00n, tipo: 'billete' },
  { pesos: 10, valor: 10_00n, tipo: 'moneda' },
  { pesos: 5, valor: 5_00n, tipo: 'moneda' },
  { pesos: 2, valor: 2_00n, tipo: 'moneda' },
  { pesos: 1, valor: 1_00n, tipo: 'moneda' },
] as const;

export type PesosDenominacion = (typeof DENOMINACIONES_MXN)[number]['pesos'];

/** Pieces per denomination, keyed by its value in pesos; missing means none. */
export type ConteoDenominaciones = Readonly<Partial<Record<PesosDenominacion, number>>>;

export function totalContado(conteo: ConteoDenominaciones): Money {
  return sum(
    DENOMINACIONES_MXN.map((d) => {
      const n = conteo[d.pesos] ?? 0;
      if (n < 0 || !Number.isInteger(n)) throw new CorteInvalidoError(`conteo de $${d.pesos}`);
      return d.valor * BigInt(n);
    }),
  );
}

export interface DiferenciaCorte {
  readonly tipo: 'cuadra' | 'falta' | 'sobra';
  /** Always non-negative. */
  readonly monto: Money;
}

export function diferenciaCorte(contado: Money, esperado: Money): DiferenciaCorte {
  if (contado === esperado) return { tipo: 'cuadra', monto: ZERO };
  return contado < esperado
    ? { tipo: 'falta', monto: esperado - contado }
    : { tipo: 'sobra', monto: contado - esperado };
}
