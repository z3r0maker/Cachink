import type { EstadoMode } from '../estado';
import type { ProductIcon } from '../ui/product-icons';

/** The screen's unit words; a linked caja maps the domain's units onto them. */
export type Unidad =
  | 'kg'
  | 'piezas'
  | 'litros'
  | 'metros'
  | 'cajas'
  | 'bolsas'
  | 'rollos'
  | 'pares';

/** A stocked item: what the sales draw down, and what the operator restocks or writes off. */
export interface Existencia {
  readonly id: string;
  readonly nombre: string;
  /** How the KPI hints name it («pastor», «queso oaxaca»). */
  readonly corto: string;
  readonly existencias: number;
  /** At or below it the row says «Reponer». */
  readonly umbral: number;
  readonly unidad: Unidad;
  readonly icono: ProductIcon;
  readonly tint: string;
}

export const MOTIVOS_MERMA = [
  'Se echó a perder',
  'Se rompió',
  'Cortesía',
  'Error de captura',
] as const;
export type MotivoMerma = (typeof MOTIVOS_MERMA)[number];

export type TipoMovimiento = 'Entrada' | 'Merma';

/** One entry or write-off of this turno; quantities in the item's unit. */
export interface Movimiento {
  readonly id: string;
  readonly existenciaId: string;
  readonly tipo: TipoMovimiento;
  readonly cantidad: number;
  /** Supplier for an entry, reason for a write-off. */
  readonly detalle: string;
  readonly hora: string;
}

export type Pestana = 'existencias' | 'movimientos';

export interface InventarioData {
  readonly operador: string;
  readonly caja: string;
  readonly existencias: readonly Existencia[];
  readonly movimientos: readonly Movimiento[];
}

export interface InventarioScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly tab: Pestana;
  readonly data: InventarioData;
  /** Linked caja: the move goes through the use case (whole quantities only). */
  readonly registrarVivo?: (m: NuevoMovimientoVivo) => void;
}

/** A move as the runtime records it (mirrors the panel's `NuevoMovimiento`). */
export interface NuevoMovimientoVivo {
  readonly tipo: TipoMovimiento;
  readonly existenciaId: string;
  readonly cantidad: number;
  readonly detalle: string;
}
