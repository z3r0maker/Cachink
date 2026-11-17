import type { Money } from '../../money/index.js';

/**
 * The year's income caps (E-15, board CD-12d), always on the whole company
 * (ADR-125 §3):
 *
 * - a SAS may take in at most its cap a year (LGSM art. 260), which the DOF
 *   updates each December;
 * - a persona moral leaves RESICO above its cap (LISR art. 206).
 *
 * Caps are kept per year, and a year without its own is never measured
 * against last year's.
 */
export interface TopesDelAnio {
  readonly anio: number;
  /** Centavos. */
  readonly sas: Money;
  readonly resico: Money;
}

export type Nivel = 60 | 80 | 95;

/** The lines that light a signal, highest first. */
export const NIVELES_LIMITE: readonly Nivel[] = [95, 80, 60];

export class TopeInvalidoError extends Error {
  readonly code = 'TOPE_INVALIDO' as const;
  constructor(detalle: string) {
    super(`Tope inválido: ${detalle}.`);
    this.name = 'TopeInvalidoError';
  }
}

export function assertTopes(t: TopesDelAnio): void {
  if (!Number.isInteger(t.anio) || t.anio < 2000 || t.anio > 2100) {
    throw new TopeInvalidoError(`el año ${t.anio} no es válido`);
  }
  if (t.sas <= 0n) throw new TopeInvalidoError('el tope de la SAS debe ser mayor a cero');
  if (t.resico <= 0n) throw new TopeInvalidoError('el tope de RESICO debe ser mayor a cero');
}

/**
 * The year's income at December if every month left brings what last month
 * did (owner decision, round 14: a stand-in until N-63's MRR). `mes` is this
 * month, 1–12; a month of refunds projects nothing.
 */
export function proyeccionAlCierre(ingresosDelAnio: Money, mesAnterior: Money, mes: number): Money {
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new TopeInvalidoError(`el mes ${mes} no es válido`);
  }
  const ritmo = mesAnterior > 0n ? mesAnterior : 0n;
  return ingresosDelAnio + ritmo * BigInt(12 - mes);
}

export interface Medidor {
  readonly tope: Money;
  readonly ingresos: Money;
  readonly proyeccion: Money;
  /** The share of the cap reached, in millionths (800000 = 80 %). */
  readonly avance: number;
  readonly avanceProyectado: number;
  /** The highest line reached, or null under 60 %. */
  readonly nivel: Nivel | null;
  /** The projection passes the cap. */
  readonly loPasa: boolean;
}

const millonesimas = (v: Money, tope: Money): number =>
  v <= 0n ? 0 : Number((v * 1_000_000n) / tope);

export function medidorDe(ingresos: Money, proyeccion: Money, tope: Money): Medidor {
  if (tope <= 0n) throw new TopeInvalidoError('el tope debe ser mayor a cero');
  const avance = millonesimas(ingresos, tope);
  return {
    tope,
    ingresos,
    proyeccion,
    avance,
    avanceProyectado: millonesimas(proyeccion, tope),
    nivel: NIVELES_LIMITE.find((n) => avance >= n * 10_000) ?? null,
    loPasa: proyeccion > tope,
  };
}
