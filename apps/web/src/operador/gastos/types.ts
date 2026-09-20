import type { Money } from '@xangarro/domain';

import type { NuevoGasto } from './registrar';

import type { EstadoMode } from '../estado';

/** The five petty-cash categories of `Operador Gastos.dc.html`. */
export const CATEGORIAS = ['Insumos', 'Servicios', 'Transporte', 'Mantenimiento', 'Otros'] as const;
export type CategoriaGasto = (typeof CATEGORIAS)[number];

/** A petty-cash expense of the open turno: it leaves the drawer and lowers the expected cash. */
export interface GastoTurno {
  readonly id: string;
  readonly concepto: string;
  /** Supplier and receipt note, as captured («Gas Express · con foto»). */
  readonly detalle: string;
  readonly monto: Money;
  readonly categoria: CategoriaGasto;
  readonly hora: string;
  readonly comprobante: boolean;
}

export interface GastosData {
  readonly operador: string;
  readonly caja: string;
  readonly desde: string;
  readonly gastos: readonly GastoTurno[];
}

export interface GastosScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly data: GastosData;
  /** Linked register: the write goes through the use case (O-35). */
  readonly registrarVivo?: (n: NuevoGasto) => void;
}
