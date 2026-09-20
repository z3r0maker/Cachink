import type { Money } from '@xangarro/domain';

import type { EstadoMode } from '../estado';

/** The operator's words for the ticket's method; «Fiado» is `Crédito` in the domain. */
export type MetodoVenta = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'QR / CoDi' | 'Fiado';

export interface VentaTurno {
  /** The ticket's id — present on a linked register, where cancel goes through the use case. */
  readonly id?: string;
  readonly folio: string;
  readonly concepto: string;
  readonly monto: Money;
  readonly metodo: MetodoVenta;
  readonly hora: string;
  /** The fiado client, when there is one. */
  readonly cliente?: string;
  readonly cancelada?: { readonly motivo: string };
}

export interface VentasData {
  readonly operador: string;
  readonly caja: string;
  readonly desde: string;
  readonly ventas: readonly VentaTurno[];
}

export interface VentasScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly data: VentasData;
  readonly filtro: 'Todos' | MetodoVenta;
}
