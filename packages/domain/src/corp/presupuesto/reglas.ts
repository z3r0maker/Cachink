import type { Money } from '../../money/index.js';
import { CATEGORIAS_GASTO, type CategoriaGasto } from '../ledger/accounts.js';
import { parsePeriodo } from '../resultados/periodo.js';
import { nombreTrimestre, trimestreDe } from '../socios/dinero.js';
import { PresupuestoError } from './errors.js';

/**
 * Presupuesto (E-22, boards CD-15d and CD-15e): one budget per quarter, a
 * monthly amount for each of the four expense categories. One founder
 * prepares it and it counts from the moment the other approves it; until
 * then the quarter has none. A rejected budget is kept, and another may be
 * prepared. Quarters are keys like `2026-T4`, which compare as strings. Pure.
 */
export type Montos = Readonly<Record<CategoriaGasto, Money>>;

export interface RespuestaPresupuesto {
  readonly kind: 'aprobado' | 'rechazado';
  readonly founderId: string;
  /** ISO timestamp. */
  readonly at: string;
}

export interface Presupuesto {
  readonly id: string;
  readonly trimestre: string;
  /** Centavos a month, per category. */
  readonly montos: Montos;
  readonly preparadoPor: string;
  readonly preparadoAt: string;
  readonly respuesta: RespuestaPresupuesto | null;
}

export function trimestreSiguiente(trimestre: string): string {
  const anio = Number(trimestre.slice(0, 4));
  const t = Number(trimestre.slice(6));
  return t === 4 ? `${anio + 1}-T1` : `${anio}-T${t + 1}`;
}

export const totalMensual = (m: Montos): Money => CATEGORIAS_GASTO.reduce((t, c) => t + m[c], 0n);

const delTrimestre = (ps: readonly Presupuesto[], trimestre: string) =>
  ps.filter((p) => p.trimestre === trimestre);

/** The quarter's budget in force: the latest one approved. */
export function presupuestoVigente(
  ps: readonly Presupuesto[],
  trimestre: string,
): Presupuesto | null {
  const aprobados = delTrimestre(ps, trimestre).filter((p) => p.respuesta?.kind === 'aprobado');
  return aprobados.sort((a, b) => a.preparadoAt.localeCompare(b.preparadoAt)).at(-1) ?? null;
}

/** The quarter's budget waiting on the other founder, if any. */
export function presupuestoPendiente(
  ps: readonly Presupuesto[],
  trimestre: string,
): Presupuesto | null {
  return delTrimestre(ps, trimestre).find((p) => p.respuesta === null) ?? null;
}

const libre = (ps: readonly Presupuesto[], t: string) =>
  presupuestoVigente(ps, t) === null && presupuestoPendiente(ps, t) === null;

/** This quarter while it has no budget, else the next one; none when both have one. */
export function trimestreAPreparar(ps: readonly Presupuesto[], hoy: string): string | null {
  const actual = trimestreDe(hoy);
  const siguiente = trimestreSiguiente(actual);
  return [actual, siguiente].find((t) => libre(ps, t)) ?? null;
}

export interface PrepararInput {
  readonly trimestre: string;
  /** Today, `YYYY-MM-DD` in Mexico. */
  readonly hoy: string;
  readonly presupuestos: readonly Presupuesto[];
  readonly montos: Montos;
}

export function assertPuedePreparar(i: PrepararInput): void {
  const periodo = parsePeriodo(i.trimestre);
  if (periodo === null || periodo.tipo !== 'trimestre') {
    throw new PresupuestoError('PRESUPUESTO_TRIMESTRE');
  }
  const nombre = nombreTrimestre(i.trimestre);
  if (periodo.hasta < i.hoy) throw new PresupuestoError('PRESUPUESTO_PASADO', nombre);
  if (presupuestoVigente(i.presupuestos, i.trimestre) !== null) {
    throw new PresupuestoError('PRESUPUESTO_APROBADO', nombre);
  }
  if (presupuestoPendiente(i.presupuestos, i.trimestre) !== null) {
    throw new PresupuestoError('PRESUPUESTO_PENDIENTE', nombre);
  }
  const negativo = CATEGORIAS_GASTO.some((c) => i.montos[c] < 0n);
  if (negativo || totalMensual(i.montos) === 0n) throw new PresupuestoError('PRESUPUESTO_MONTOS');
}

/** Only the other founder answers a budget, once. */
export function assertPuedeResponderPresupuesto(
  p: Presupuesto | undefined,
  founderId: string,
): Presupuesto {
  if (p === undefined) throw new PresupuestoError('PRESUPUESTO_DESCONOCIDO');
  if (p.respuesta !== null) throw new PresupuestoError('PRESUPUESTO_RESPONDIDO');
  if (p.preparadoPor === founderId) throw new PresupuestoError('PRESUPUESTO_MISMO_SOCIO');
  return p;
}
