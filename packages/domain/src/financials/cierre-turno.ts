/**
 * The turno's cash close (ADR-074 §3–4). One calculator for the expected cash:
 *
 *   esperado = fondo + ventas en efectivo + abonos en efectivo − gastos de caja
 *
 * Fiado is excluded by construction: only cash inputs exist. The count is per
 * denomination (the JSON column on `caja_turnos`), in whole pieces, keyed
 * by `clave` (billete-20 and moneda-20 apart); totals are exact centavos.
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

/**
 * Mexico's cash, bills first. The $20 exists as a bill AND a coin, and the
 * count reaches the centavos, so each denomination has its own key and every
 * value is in centavos: the total is exact, never a float of pesos.
 */
export const DENOMINACIONES_MXN = [
  { clave: 'billete-1000', valor: 1000_00n, tipo: 'billete', etiqueta: '$1000' },
  { clave: 'billete-500', valor: 500_00n, tipo: 'billete', etiqueta: '$500' },
  { clave: 'billete-200', valor: 200_00n, tipo: 'billete', etiqueta: '$200' },
  { clave: 'billete-100', valor: 100_00n, tipo: 'billete', etiqueta: '$100' },
  { clave: 'billete-50', valor: 50_00n, tipo: 'billete', etiqueta: '$50' },
  { clave: 'billete-20', valor: 20_00n, tipo: 'billete', etiqueta: '$20' },
  { clave: 'moneda-20', valor: 20_00n, tipo: 'moneda', etiqueta: '$20' },
  { clave: 'moneda-10', valor: 10_00n, tipo: 'moneda', etiqueta: '$10' },
  { clave: 'moneda-5', valor: 5_00n, tipo: 'moneda', etiqueta: '$5' },
  { clave: 'moneda-2', valor: 2_00n, tipo: 'moneda', etiqueta: '$2' },
  { clave: 'moneda-1', valor: 1_00n, tipo: 'moneda', etiqueta: '$1' },
  { clave: 'moneda-0.50', valor: 50n, tipo: 'moneda', etiqueta: '50¢' },
  { clave: 'moneda-0.20', valor: 20n, tipo: 'moneda', etiqueta: '20¢' },
  { clave: 'moneda-0.10', valor: 10n, tipo: 'moneda', etiqueta: '10¢' },
] as const;

export type Denominacion = (typeof DENOMINACIONES_MXN)[number];
export type ClaveDenominacion = Denominacion['clave'];

/** Pieces per denomination, keyed by its `clave`; missing means none. */
export type ConteoDenominaciones = Readonly<Partial<Record<ClaveDenominacion, number>>>;

/**
 * Counts saved before the $20 coin and the centavos were keyed by pesos, and
 * back then «20» could only be the bill.
 */
const CLAVE_ANTERIOR: Readonly<Record<string, ClaveDenominacion>> = {
  '1000': 'billete-1000',
  '500': 'billete-500',
  '200': 'billete-200',
  '100': 'billete-100',
  '50': 'billete-50',
  '20': 'billete-20',
  '10': 'moneda-10',
  '5': 'moneda-5',
  '2': 'moneda-2',
  '1': 'moneda-1',
};

const CLAVES = new Set<string>(DENOMINACIONES_MXN.map((d) => d.clave));

/**
 * A stored count (the JSON column) as a `ConteoDenominaciones`: current keys
 * pass, old pesos keys are translated, anything else (an unknown key, a
 * negative or fractional count) is dropped.
 */
export function normalizarConteo(raw: Readonly<Record<string, unknown>>): ConteoDenominaciones {
  const out: Partial<Record<ClaveDenominacion, number>> = {};
  for (const [k, n] of Object.entries(raw)) {
    const clave = CLAVES.has(k) ? (k as ClaveDenominacion) : CLAVE_ANTERIOR[k];
    if (clave === undefined || typeof n !== 'number' || !Number.isInteger(n) || n < 0) continue;
    out[clave] = (out[clave] ?? 0) + n;
  }
  return out;
}

/** The counted cash in centavos: whole pieces times each denomination's value. */
export function totalContado(conteo: ConteoDenominaciones): Money {
  return sum(
    DENOMINACIONES_MXN.map((d) => {
      const n = conteo[d.clave] ?? 0;
      if (n < 0 || !Number.isInteger(n)) throw new CorteInvalidoError(`conteo de ${d.clave}`);
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
