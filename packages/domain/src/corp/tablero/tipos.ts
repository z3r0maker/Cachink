import type { Money } from '../../money/index.js';
import type { Socio } from '../ledger/movements.js';

/**
 * The Tablero's records (E-20, OD-4 answered 2026-11-19). A card lives from
 * the quarter it was planned in until it is accepted or taken off a plan, so
 * an unaccepted card rolls into the next quarter with its value and counts as
 * not delivered in the one it missed. Its state is read from its events.
 */
export type TipoTarjeta = 'entregable' | 'tarea';

export type TipoEvento =
  'iniciada' | 'terminada' | 'aceptada' | 'objetada' | 'al_mediador' | 'resuelta' | 'hecha';

export interface EventoTarjeta {
  readonly tipo: TipoEvento;
  /** The partner who acted. */
  readonly socio: Socio;
  /** `YYYY-MM-DD`, Mexico City. */
  readonly fecha: string;
  /** «Terminado»'s evidence as a link. */
  readonly enlace: string | null;
  /** The Expediente document: the evidence, or the mediator's ruling. */
  readonly documentoId: string | null;
  /** An objection's unmet part, or the note taking it to the mediator. */
  readonly motivo: string | null;
  /** The mediator's ruling; null for every other event. */
  readonly aceptada: boolean | null;
}

export interface Tarjeta {
  readonly id: string;
  /** The quarter it was planned in, `YYYY-TN`. */
  readonly trimestre: string;
  readonly tipo: TipoTarjeta;
  readonly titulo: string;
  readonly criterio: string;
  readonly responsable: Socio;
  /** `YYYY-MM-DD`. */
  readonly vence: string;
  readonly objetivoId: string | null;
  /** Each partner's proposed value, centavos; a task has none. */
  readonly valores: { readonly 1: Money | null; readonly 2: Money | null };
  /** A third party's quote, centavos without IVA, when the proposals differ over 2×. */
  readonly cotizacion: Money | null;
  readonly cotizacionDocId: string | null;
  /** The quarter whose plan it was taken off; it is not alive from then on. */
  readonly descartadaEn: string | null;
  /** Oldest first. */
  readonly eventos: readonly EventoTarjeta[];
}

export type TipoEventoPlan = 'enviado' | 'aprobado' | 'rechazado';

export interface EventoPlan {
  readonly trimestre: string;
  readonly tipo: TipoEventoPlan;
  readonly socio: Socio;
  /** `YYYY-MM-DD`, Mexico City. */
  readonly fecha: string;
}

export interface AvanceObjetivo {
  readonly valor: number;
  readonly fecha: string;
  readonly socio: Socio;
}

export interface Objetivo {
  readonly id: string;
  readonly trimestre: string;
  /** Null for «Ambos». */
  readonly quien: Socio | null;
  readonly titulo: string;
  readonly meta: number;
  /** «negocios», «meses», «pasos». */
  readonly unidad: string;
  /** Oldest first. */
  readonly avances: readonly AvanceObjetivo[];
}

export const otroSocio = (s: Socio): Socio => (s === 1 ? 2 : 1);
