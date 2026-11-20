import type { Money } from '../../money/index.js';
import { CATEGORIAS_GASTO, type CategoriaGasto } from '../ledger/accounts.js';
import { mesesHasta } from '../resultados/periodo.js';
import { PresupuestoError } from './errors.js';

/**
 * Spending outside the budget (E-22, boards CD-15d and CD-15e). Each founder
 * has a monthly Límite: the larger of $1,000.00 and 10 % of the average
 * income without IVA of the last three whole months. A request that fits in
 * what is left of it is approved on its own; above it the other founder
 * approves it, for less if they choose, or rejects it. A request does not
 * register the expense: that is still captured in Registrar. Pure.
 */
export const LIMITE_MINIMO: Money = 1_000_00n;
/** 10 %, in basis points. */
export const LIMITE_BPS = 1_000n;
/** Months of income the Límite averages. */
export const MESES_LIMITE = 3;

/** The three whole months before `mes` (`YYYY-MM`) that the Límite averages, oldest first. */
export const mesesDelLimite = (mes: string): readonly string[] =>
  mesesHasta(mes, MESES_LIMITE + 1).slice(0, MESES_LIMITE);

export function limiteDeGasto(ingresoPromedio: Money): Money {
  const proporcional = (ingresoPromedio * LIMITE_BPS) / 10_000n;
  return proporcional > LIMITE_MINIMO ? proporcional : LIMITE_MINIMO;
}

export interface RespuestaSolicitud {
  readonly kind: 'aprobada' | 'rechazada';
  /** What was approved, centavos; null when rejected. */
  readonly monto: Money | null;
  readonly founderId: string;
  readonly at: string;
}

export interface SolicitudGasto {
  readonly id: string;
  /** The month it was asked in, `YYYY-MM`. */
  readonly periodo: string;
  readonly founderId: string;
  readonly concepto: string;
  readonly categoria: CategoriaGasto;
  /** Centavos, with IVA. */
  readonly monto: Money;
  /** Approved on its own, inside its founder's Límite. */
  readonly automatica: boolean;
  readonly at: string;
  readonly respuesta: RespuestaSolicitud | null;
}

export type EstadoSolicitud = 'automatica' | 'pendiente' | 'aprobada' | 'rechazada';

export function estadoDeSolicitud(s: SolicitudGasto): EstadoSolicitud {
  if (s.automatica) return 'automatica';
  return s.respuesta?.kind ?? 'pendiente';
}

/** What a request let be spent: zero while waiting or once rejected. */
export function montoAprobado(s: SolicitudGasto): Money {
  if (s.automatica) return s.monto;
  return s.respuesta?.kind === 'aprobada' ? (s.respuesta.monto ?? s.monto) : 0n;
}

/** What a founder had approved on their own in a month. */
export function usadoDelLimite(
  ss: readonly SolicitudGasto[],
  founderId: string,
  periodo: string,
): Money {
  return ss
    .filter((s) => s.automatica && s.founderId === founderId && s.periodo === periodo)
    .reduce((t, s) => t + s.monto, 0n);
}

export function cabeEnElLimite(i: {
  readonly monto: Money;
  readonly limite: Money;
  readonly usado: Money;
}): boolean {
  return i.usado + i.monto <= i.limite;
}

export interface PedirInput {
  readonly concepto: string;
  readonly categoria: string;
  readonly monto: Money;
}

export const esCategoriaGasto = (c: string): c is CategoriaGasto =>
  (CATEGORIAS_GASTO as readonly string[]).includes(c);

/** Returns the request's category, checked. */
export function assertPuedePedir(i: PedirInput): CategoriaGasto {
  if (i.concepto.trim() === '') throw new PresupuestoError('SOLICITUD_CONCEPTO');
  if (i.monto <= 0n) throw new PresupuestoError('SOLICITUD_MONTO');
  if (!esCategoriaGasto(i.categoria)) throw new PresupuestoError('SOLICITUD_CATEGORIA');
  return i.categoria;
}

/** Only the other founder answers a request still waiting; less than asked, never more. */
export function assertPuedeResponderSolicitud(
  s: SolicitudGasto | undefined,
  founderId: string,
  otroMonto: Money | null,
): SolicitudGasto {
  if (s === undefined) throw new PresupuestoError('SOLICITUD_DESCONOCIDA');
  if (estadoDeSolicitud(s) !== 'pendiente') throw new PresupuestoError('SOLICITUD_RESPONDIDA');
  if (s.founderId === founderId) throw new PresupuestoError('SOLICITUD_MISMO_SOCIO');
  if (otroMonto !== null && (otroMonto <= 0n || otroMonto >= s.monto)) {
    throw new PresupuestoError('SOLICITUD_OTRO_MONTO');
  }
  return s;
}
