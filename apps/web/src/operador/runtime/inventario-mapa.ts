/**
 * The register's inventory vocabulary (O-24 live), pure so both the Worker and
 * the tests use it: which ledger rows are «this turno's movements», and how
 * the screen's two moves become the domain's `tipo` + `motivo`.
 */

/** A stocked product as the Worker hands it (domain unit, icon and colour). */
export interface ExistenciaPara {
  readonly id: string;
  readonly nombre: string;
  /** `sumStock`: the movements plus the retention baseline; may be negative. */
  readonly existencias: number;
  readonly umbral: number;
  /** The domain's unit ('pza', 'kg', 'lt'…); the screen says its own word. */
  readonly unidad: string;
  readonly icono: string | null;
  readonly color: string;
  readonly categoria: string;
}

/** One manual movement of this turno, already in the screen's two kinds. */
export interface MovimientoPara {
  readonly id: string;
  readonly productoId: string;
  readonly tipo: 'Entrada' | 'Merma';
  readonly cantidad: number;
  readonly nota: string | null;
  /** UTC ISO stamp; the screen says it in local time. */
  readonly createdAt: string;
}

export interface InventarioPara {
  readonly existencias: readonly ExistenciaPara[];
  readonly movimientos: readonly MovimientoPara[];
}

/** The ledger row fields the turno filter reads. */
export interface FilaMovimiento {
  readonly id: string;
  readonly productoId: string;
  readonly tipo: 'entrada' | 'salida';
  readonly cantidad: number;
  readonly motivo: string;
  readonly nota: string | null;
  readonly origen: string;
  readonly deviceId: string;
  readonly createdAt: string;
  readonly deletedAt: string | null;
}

export const MOTIVO_ENTRADA = 'Compra a proveedor';
export const MOTIVO_MERMA = 'Merma / daño';

/**
 * This turno's manual movements: this device, written since the apertura,
 * never a sale's automatic salida; entradas are «Entrada», salidas for
 * «Merma / daño» are «Merma» (other salidas are the owner's, not the screen's).
 * Oldest first, as the screen appends.
 */
export function delTurno(
  rows: readonly FilaMovimiento[],
  deviceId: string,
  aperturaAt: string,
): readonly MovimientoPara[] {
  return rows
    .filter(
      (m) =>
        m.deletedAt === null &&
        m.deviceId === deviceId &&
        m.createdAt >= aperturaAt &&
        m.origen === 'manual' &&
        m.motivo !== 'Venta' &&
        (m.tipo === 'entrada' || m.motivo === MOTIVO_MERMA),
    )
    .map((m) => ({
      id: m.id,
      productoId: m.productoId,
      tipo: m.tipo === 'entrada' ? ('Entrada' as const) : ('Merma' as const),
      cantidad: m.cantidad,
      nota: m.nota,
      createdAt: m.createdAt,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
}

/** «3 entradas · 2 mermas» for the cierre's resumen band. */
export function contar(movs: readonly MovimientoPara[]): {
  readonly entradas: number;
  readonly mermas: number;
} {
  return {
    entradas: movs.filter((m) => m.tipo === 'Entrada').length,
    mermas: movs.filter((m) => m.tipo === 'Merma').length,
  };
}

/**
 * The screen's move as the domain records it. Quantities are whole numbers in
 * the domain, so a decimal is refused here too (the panel already refuses it).
 */
export function movimientoDominio(
  tipo: 'Entrada' | 'Merma',
  cantidad: number,
  detalle: string,
): {
  readonly tipo: 'entrada' | 'salida';
  readonly motivo: string;
  readonly cantidad: number;
  readonly nota?: string;
} {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error('La cantidad debe ser un número entero mayor que cero');
  }
  const nota = detalle.trim().slice(0, 500);
  return {
    tipo: tipo === 'Entrada' ? 'entrada' : 'salida',
    motivo: tipo === 'Entrada' ? MOTIVO_ENTRADA : MOTIVO_MERMA,
    cantidad,
    ...(nota === '' ? {} : { nota }),
  };
}

/** The two Worker requests (spliced into protocol.ts's union, kept here for its budget). */
export type InventarioRequest =
  | {
      readonly id: number;
      readonly method: 'inventario';
      readonly businessId: string;
      readonly deviceId: string;
      readonly turnoId: string;
    }
  | {
      readonly id: number;
      readonly method: 'moverInventario';
      readonly businessId: string;
      readonly deviceId: string;
      readonly userId: string;
      readonly productoId: string;
      /** The screen's move; the worker maps it to the domain's tipo + motivo. */
      readonly tipo: 'Entrada' | 'Merma';
      readonly cantidad: number;
      readonly detalle: string;
    };

/** The write's call, minus its RPC id. */
export type MoverInventarioCall = Omit<
  Extract<InventarioRequest, { readonly method: 'moverInventario' }>,
  'id'
>;

/**
 * The caja tile's stock: the ledger's count for a product that tracks stock
 * (never below zero on screen), and «no chip» (a count above its threshold)
 * for one that doesn't.
 */
export function stockDeCaja(
  existencias: number | null,
  umbral: number | null,
): { readonly existencias: number; readonly umbral: number } {
  if (existencias === null) return { existencias: 1, umbral: 0 };
  return { existencias: Math.max(0, existencias), umbral: umbral ?? 0 };
}
