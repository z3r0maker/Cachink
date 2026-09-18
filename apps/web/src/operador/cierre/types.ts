import type { ConteoDenominaciones, Money } from '@xangarro/domain';

import type { EstadoMode } from '../estado';
import type { PartesEsperado } from '../turno/desglose';

/** Close-out reasons in the file; the `caja_turnos` enum has six (open for O-06). */
export const MOTIVOS_DIFERENCIA = [
  'Cambio mal dado',
  'Venta no registrada',
  'Vale de empleado',
  'Propinas',
  'No sé',
] as const;
export type MotivoDiferencia = (typeof MOTIVOS_DIFERENCIA)[number];

export interface ResumenTurno {
  readonly ventas: number;
  readonly cobrado: Money;
  readonly canceladas: number;
  readonly cancelado: Money;
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
  readonly partes: PartesEsperado;
  readonly resumen: ResumenTurno;
  /** The count as the operator left it (the file starts mid-count). */
  readonly conteo: ConteoDenominaciones;
}

export interface CierreScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly data: CierreData;
}
