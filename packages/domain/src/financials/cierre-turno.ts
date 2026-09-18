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
