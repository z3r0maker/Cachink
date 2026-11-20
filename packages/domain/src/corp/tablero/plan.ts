import type { IsoDate } from '../../dates/index.js';
import { sumarDias } from '../../dates/periodo.js';
import { formatDate } from '../../format/date.js';
import type { Money } from '../../money/index.js';
import type { Socio } from '../ledger/movements.js';
import { trimestreSiguiente } from '../presupuesto/reglas.js';
import { nombreTrimestre, rangoDelTrimestre, trimestreDe } from '../socios/dinero.js';
import { TableroError } from './errors.js';
import { estadoDeTarjeta } from './estado.js';
import type { EventoPlan, Tarjeta, TipoTarjeta } from './tipos.js';
import { valorDeTarjeta } from './valor.js';

/**
 * The quarter's plan (OD-4 §5): one partner sends it, the other approves it,
 * and that freezes its values. A plan is approved until day 10 of its
 * quarter; without one, each partner's commitment is the previous quarter's.
 */
export type EstadoPlan =
  | { readonly fase: 'borrador' }
  | { readonly fase: 'enviado'; readonly por: Socio; readonly el: string }
  | { readonly fase: 'aprobado'; readonly por: Socio; readonly el: string };

export function estadoDelPlan(eventos: readonly EventoPlan[], trimestre: string): EstadoPlan {
  const ultimo = eventos.filter((e) => e.trimestre === trimestre).at(-1);
  if (ultimo === undefined || ultimo.tipo === 'rechazado') return { fase: 'borrador' };
  return { fase: ultimo.tipo, por: ultimo.socio, el: ultimo.fecha };
}

/** Day 10 of the quarter. */
export const limiteDelPlan = (trimestre: string): string =>
  sumarDias(rangoDelTrimestre(trimestre)[0] as IsoDate, 9);

function assertEnPlazo(trimestre: string, hoy: string): void {
  const limite = limiteDelPlan(trimestre);
  if (hoy > limite) throw new TableroError('PLAN_FUERA_DE_PLAZO', formatDate(limite as IsoDate));
}

export function assertPuedeEnviar(p: {
  readonly trimestre: string;
  readonly plan: EstadoPlan;
  readonly hoy: string;
}): void {
  if (p.plan.fase !== 'borrador')
    throw new TableroError('PLAN_ESTADO', nombreTrimestre(p.trimestre));
  assertEnPlazo(p.trimestre, p.hoy);
}

export function assertPuedeResponderPlan(p: {
  readonly trimestre: string;
  readonly plan: EstadoPlan;
  readonly socio: Socio;
  readonly hoy: string;
  /** Deliverables of the plan without a value yet. */
  readonly sinValor: number;
  readonly aprobar: boolean;
}): void {
  if (p.plan.fase !== 'enviado')
    throw new TableroError('PLAN_ESTADO', nombreTrimestre(p.trimestre));
  if (p.plan.por === p.socio) throw new TableroError('PLAN_EL_OTRO');
  assertEnPlazo(p.trimestre, p.hoy);
  if (p.aprobar && p.sinValor > 0) {
    throw new TableroError(
      'PLAN_SIN_VALORES',
      p.sinValor === 1 ? '1 tarjeta' : `${p.sinValor} tarjetas`,
    );
  }
}

export interface NuevaTarjeta {
  readonly trimestre: string;
  readonly hoy: string;
  readonly tipo: TipoTarjeta;
  readonly titulo: string;
  readonly criterio: string;
  readonly vence: string;
  /** The creator's proposal, centavos; a task has none. */
  readonly valor: Money | null;
}

/** This quarter, or the next one's plan. Returns the trimmed card. */
export function assertNuevaTarjeta(n: NuevaTarjeta): NuevaTarjeta {
  const actual = trimestreDe(n.hoy);
  if (n.trimestre !== actual && n.trimestre !== trimestreSiguiente(actual)) {
    throw new TableroError('TARJETA_TRIMESTRE');
  }
  const titulo = n.titulo.trim();
  const criterio = n.criterio.trim();
  if (titulo === '') throw new TableroError('TARJETA_TITULO');
  const [desde, hasta] = rangoDelTrimestre(n.trimestre);
  if (!(n.vence >= desde && n.vence < hasta)) {
    throw new TableroError('TARJETA_VENCE', nombreTrimestre(n.trimestre));
  }
  if (n.tipo === 'tarea') return { ...n, titulo, criterio, valor: null };
  if (criterio === '') throw new TableroError('TARJETA_CRITERIO');
  if (n.valor === null || n.valor <= 0n) throw new TableroError('TARJETA_VALOR');
  return { ...n, titulo, criterio };
}

const descartada = (t: Tarjeta, hoy: string) =>
  t.descartadaEn !== null && trimestreDe(hoy) >= t.descartadaEn;

/**
 * A partner's value for a card of the plan `plan` (its first quarter's). It
 * changes until the plan is approved; after that only while the card still
 * lacks a value, and never once work started or a quote set it.
 */
export function assertPuedeProponer(
  t: Tarjeta,
  p: { readonly plan: EstadoPlan; readonly valor: Money; readonly hoy: string },
): void {
  if (descartada(t, p.hoy)) throw new TableroError('TARJETA_DESCARTADA');
  if (t.tipo === 'tarea') throw new TableroError('TARJETA_ESTADO');
  if (p.valor <= 0n) throw new TableroError('TARJETA_VALOR');
  const congelada =
    estadoDeTarjeta(t, p.hoy).fase !== 'por_hacer' ||
    t.cotizacion !== null ||
    (p.plan.fase === 'aprobado' && valorDeTarjeta(t).valor !== null);
  if (congelada) throw new TableroError('TARJETA_CONGELADA');
}

export function assertPuedeCotizar(
  t: Tarjeta,
  q: { readonly monto: Money; readonly documentoId: string | null },
): void {
  if (valorDeTarjeta(t).fuente !== 'cotizacion_requerida') {
    throw new TableroError('COTIZACION_NO_REQUERIDA');
  }
  if (q.monto <= 0n || q.documentoId === null) throw new TableroError('COTIZACION_DOCUMENTO');
}

/** Off the plan of `trimestre`, while it is not approved and the card not started. */
export function assertPuedeQuitar(
  t: Tarjeta,
  p: { readonly trimestre: string; readonly plan: EstadoPlan; readonly hoy: string },
): void {
  if (p.plan.fase === 'aprobado')
    throw new TableroError('PLAN_ESTADO', nombreTrimestre(p.trimestre));
  assertEnPlazo(p.trimestre, p.hoy);
  const fuera =
    t.trimestre > p.trimestre || (t.descartadaEn !== null && t.descartadaEn <= p.trimestre);
  if (fuera || estadoDeTarjeta(t, p.hoy).fase !== 'por_hacer')
    throw new TableroError('TARJETA_ESTADO');
}
