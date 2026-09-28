/**
 * What the Cierre screen draws from: the turno's data, the count state, the
 * queue (ADR-123: a warning, never a block) and the close; and, once closed,
 * the snapshot «Turno cerrado» shows while the turno itself is gone.
 */
import type { CierreData, MotivoDiferencia } from '@xangarro/caja/cierre';
import type { DiferenciaCorte, Money } from '@xangarro/domain';
import type { ConteoCierre } from './use-conteo-cierre';

export interface ColaCierre {
  /** Records the server has not accepted yet (the pill's count). */
  readonly porEnviar: number;
  /** Of those, the ones that retry by themselves. */
  readonly reintentando: number;
  readonly enviando: boolean;
  readonly reintentar: () => void;
}

export interface CierreHecho {
  readonly data: CierreData;
  readonly contado: Money;
  /** As the use case stored it. */
  readonly esperado: Money;
  readonly dif: DiferenciaCorte;
  readonly motivo: MotivoDiferencia | null;
  /** Records still to send when it closed: the owner sees the close once they go up. */
  readonly porEnviar: number;
  /** «14 may». */
  readonly fecha: string;
}

export type CierreState = 'loading' | 'error' | 'sin-turno' | 'happy';

export interface CierreVista {
  readonly state: CierreState;
  readonly data: CierreData | null;
  readonly conteo: ConteoCierre;
  readonly cola: ColaCierre;
  readonly cerrar: () => void;
  readonly cerrando: boolean;
  /** The last close attempt failed; the count stays as it was. */
  readonly fallo: boolean;
  readonly hecho: CierreHecho | null;
  readonly refetch: () => void;
}
