import type { Money } from '@xangarro/domain';

import type { EstadoMode } from '../estado';
import type { Abierta } from './detalle/types';

/**
 * The operator's words for the ticket's method; «Fiado» is `Crédito` in the
 * domain. A ticket taken before ADR-108 retired QR/CoDi reads back as
 * «Transferencia» (see `comoMetodo`), so the screens only ever know four.
 */
export type MetodoVenta = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Fiado';

export interface VentaTurno {
  /** The ticket's id: present on a linked register, where cancel goes through the use case. */
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
  /** The comprobante's header; the fixture's business when absent. */
  readonly negocio?: string;
  readonly operador: string;
  readonly caja: string;
  readonly desde: string;
  readonly ventas: readonly VentaTurno[];
}

export interface VentasScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly data: VentasData;
  readonly filtro: 'Todos' | MetodoVenta;
  /** Open with this ticket's drawer (the `/ventas/[folio]` route). */
  readonly abierta?: Abierta;
}
