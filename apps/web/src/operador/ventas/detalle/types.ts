import type { Money } from '@xangarro/domain';

import type { Categoria } from '../../caja/types';
import type { EstadoMode } from '../../estado';
import type { MetodoVenta } from '../types';

export interface LineaDetalle {
  readonly productoId: string;
  readonly nombre: string;
  readonly precio: Money;
  readonly cantidad: number;
  /** Tints the quantity box, as on the catalogue tile. */
  readonly categoria: Categoria;
}

/** One ticket of the open turno, as the register stored it (ADR-073). */
export interface VentaDetalle {
  readonly folio: string;
  /** «Hoy 14:52». */
  readonly cuando: string;
  readonly metodo: MetodoVenta;
  readonly lineas: readonly LineaDetalle[];
  /** Cash handed over; only on cash sales. */
  readonly recibido?: Money;
  /** The client and the balance this sale left them with; only on fiado sales. */
  readonly fiado?: { readonly cliente: string; readonly saldo: Money };
  readonly cancelada?: { readonly motivo: string };
  /** Still in this register's send queue (captured offline). */
  readonly enCola?: boolean;
}

export interface DetalleData {
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
}
