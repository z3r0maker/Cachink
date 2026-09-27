import type { Money } from '@xangarro/domain';

import type { Categoria } from '../../caja/types';
import type { EstadoMode } from '../../estado';
import type { MetodoVenta } from '../types';

export interface LineaDetalle {
  readonly productoId: string;
  readonly nombre: string;
  /** Absent when only the list's summary is known (a fixture row without its ticket). */
  readonly precio?: Money;
  readonly cantidad: number;
  /** Tints the line's icon square, as on the catalogue tile. */
  readonly categoria: Categoria;
}

/** One ticket of the open turno, as the register stored it (ADR-073). */
export interface VentaDetalle {
  /** The ticket's id: present on a linked register (O-34). */
  readonly id?: string;
  readonly folio: string;
  /** «Hoy 14:52». */
  readonly cuando: string;
  readonly metodo: MetodoVenta;
  readonly lineas: readonly LineaDetalle[];
  /** The ticket's total when its lines carry no price; otherwise their sum. */
  readonly total?: Money;
  /** Cash handed over; only on cash sales. */
  readonly recibido?: Money;
  /** The client, and the balance this sale left them with when known; only on fiado sales. */
  readonly fiado?: { readonly cliente: string; readonly saldo?: Money };
  readonly cancelada?: { readonly motivo: string };
  /** Still in this register's send queue (captured offline). */
  readonly enCola?: boolean;
  /** Who captured it, when the register says so. */
  readonly capturo?: string;
}

export interface DetalleData {
  /** True on a linked register: cancellation goes through the use case (O-34). */
  readonly vinculado?: boolean;
  readonly negocio: string;
  readonly operador: string;
  readonly caja: string;
  /** «Hoy, abierto 08:15». */
  readonly turno: string;
  /** `null` when the folio is not in this turno any more. */
  readonly venta: VentaDetalle | null;
}

export interface DetalleScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly data: DetalleData;
  /** Linked: reload the ticket after a real cancellation (O-34). */
  readonly recargar?: () => void;
}

/**
 * What `/ventas/[folio]` opens over the list: the folio, the state the
 * route forces in development, and the fixture ticket it chose (`undefined`
 * lets the drawer look the folio up; `null` is «ya no existe»).
 */
export interface Abierta {
  readonly folio: string;
  readonly state: 'happy' | EstadoMode;
  readonly venta?: VentaDetalle | null;
}

/** The drawer's ticket as loaded. */
export type CargaTicket =
  | { readonly state: 'happy'; readonly venta: VentaDetalle }
  | { readonly state: EstadoMode };
