import type { Money } from '@xangarro/domain';

import type { EstadoMode } from '../estado';
import type { ProductIcon } from '../ui/product-icons';

export type Categoria = 'Tacos' | 'Guisados' | 'Bebidas' | 'Extras';

export interface Producto {
  readonly id: string;
  readonly nombre: string;
  readonly precio: Money;
  readonly categoria: Categoria;
  readonly existencias: number;
  /** At or below it the tile shows «Quedan N» in red; above it, nothing. */
  readonly umbral: number;
  readonly icono: ProductIcon;
}

export interface ClienteFiado {
  readonly id: string;
  readonly nombre: string;
  readonly telefono: string;
  readonly saldo: Money;
}

export interface LineaTicket {
  readonly productoId: string;
  readonly nombre: string;
  readonly precio: Money;
  readonly cantidad: number;
}

export interface CajaData {
  readonly negocio: string;
  readonly caja: string;
  readonly ventasTurno: number;
  readonly siguienteFolio: string;
  readonly catalogo: readonly Producto[];
  readonly clientes: readonly ClienteFiado[];
  /** A ticket in progress when the screen opens (kept across a lock, O-13). */
  readonly ticket: readonly LineaTicket[];
}

export type CobroPaso = 'catalogo' | 'metodo' | 'efectivo' | 'credito';

export interface CajaScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly data: CajaData;
  readonly paso: CobroPaso;
}
