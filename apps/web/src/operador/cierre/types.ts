import type { ConteoDenominaciones, Money } from '@xangarro/domain';

import type { EstadoMode } from '../estado';
import type { PartesEsperado } from '../turno/desglose';
import type { CerrarVivo } from './use-cierre';

/** Close-out reasons on the board; only «Otra razón» asks for a note. */
export const MOTIVOS_DIFERENCIA = [
  'Cambio mal dado',
  'Venta no registrada',
  'Salió un vale',
  'Otra razón',
] as const;
export type MotivoDiferencia = (typeof MOTIVOS_DIFERENCIA)[number];

export interface ResumenTurno {
  readonly ventas: number;
  readonly cobrado: Money;
  readonly canceladas: number;
  readonly cancelado: Money;
  /** When the one cancellation happened («12:58»), if there was exactly one. */
  readonly canceladaHora?: string;
  readonly fiado: Money;
  readonly entradas: number;
  readonly mermas: number;
}

export interface CierreData {
  readonly operador: string;
  readonly caja: string;
  readonly desde: string;
  readonly hasta: string;
  readonly dueno: string;
  /** The business on the printed corte («Taquería Don Pedro»), when known. */
  readonly negocio?: string;
  readonly partes: PartesEsperado;
  readonly resumen: ResumenTurno;
  /** The count as the operator left it (the file starts mid-count). */
  readonly conteo: ConteoDenominaciones;
}

export interface CierreScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly data: CierreData;
  /** Linked register: the close goes through the use case (O-36). */
  readonly cerrarVivo?: CerrarVivo;
}
