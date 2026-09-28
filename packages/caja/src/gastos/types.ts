import type { Money } from '@xangarro/domain';

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

export interface NuevoGasto {
  readonly monto: bigint;
  readonly concepto: string;
  readonly categoria: CategoriaGasto;
  /** Who was paid, when the operator said («La tienda, el gasero»). */
  readonly proveedor: string | null;
  /** The receipt photo's file name; `null` means «sin comprobante». */
  readonly foto: string | null;
  /** Set when the drawer was opened to pay a due recurring gasto. */
  readonly recurrenteId?: string;
}

/** A due recurring gasto the drawer opens filled with (Mi turno and Inicio's «Registrar»). */
export interface PrefillGasto {
  readonly recurrenteId: string;
  readonly concepto: string;
  readonly monto: bigint;
  readonly categoria: CategoriaGasto;
  readonly proveedor: string | null;
}

export interface GastosScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly data: GastosData;
  /** Linked register: the write goes through the use case (O-35). */
  readonly registrarVivo?: (n: NuevoGasto) => void;
  /** A due recurring gasto to pay: the drawer opens filled with it. */
  readonly prefill?: PrefillGasto | null;
}
