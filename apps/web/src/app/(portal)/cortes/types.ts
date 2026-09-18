import type { ConteoDenominaciones, Money } from '@xangarro/domain';

export type EstadoCorte = 'Cuadró' | 'Por aclarar' | 'Aclarado';

/** One closed turno as the owner reviews it; `contado` derives from `conteo` (ADR-074 §4). */
export interface Corte {
  readonly id: string;
  readonly operador: string;
  readonly iniciales: string;
  readonly tint: string;
  readonly caja: string;
  /** «14 may». */
  readonly dia: string;
  /** «08:15 a 21:04». */
  readonly horario: string;
  readonly fondo: Money;
  readonly ventasEfectivo: Money;
  readonly abonosEfectivo: Money;
  readonly gastosCaja: Money;
  /** The operator's count by denomination, written once at close. */
  readonly conteo: ConteoDenominaciones;
  readonly motivo?: string;
  readonly nota?: string;
  readonly estado: EstadoCorte;
  /** «Qué más pasó en el turno». */
  readonly eventos: readonly Evento[];
}

export interface Evento {
  readonly label: string;
  readonly value: string;
  readonly tone: 'plain' | 'danger' | 'warning' | 'soft';
}

export type FiltroCortes = 'Todos' | 'Por aclarar' | 'Con diferencia' | 'Caja 1' | 'Caja 2';
