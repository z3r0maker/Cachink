/**
 * The Cobrar catalogue as the tiles read it (MvCobrar, TbCobrar): the phone's
 * real products with their stock chip and tint, the category chips and the
 * filter. The chips are the categories the business's products actually
 * carry; the web caja's four fixed chips (`categoriaDe`, apps/web) come from
 * the design fixture and would put a real catalogue under «Extras».
 */
import { formatMoney, mismoCodigo, resolveProductIcon } from '@xangarro/domain';
import type { Money, Product, ProductIcon } from '@xangarro/domain';
import { matches } from '@xangarro/caja';
import { stockDeCaja } from '@xangarro/caja/lectura';
import { PRODUCT_BG_COLORS } from '../../product-colors';

export const TODOS = 'Todos';

export interface ProductoCobrar {
  readonly id: string;
  readonly nombre: string;
  readonly precio: Money;
  readonly categoria: string;
  readonly icono: ProductIcon;
  /** The tile's soft background, from the product's own colour. */
  readonly tint: string;
  /** The barcode, when the product has one. */
  readonly codigo: string | null;
  /** «Quedan N» shows only for a tracked product at or under its threshold. */
  readonly quedan: number | null;
  /** Given at the counter and still waiting in the owner's Revisión de caja. */
  readonly pendiente: boolean;
}

export function productosDeCaja(
  productos: readonly Product[],
  stockMap: ReadonlyMap<string, number>,
): readonly ProductoCobrar[] {
  return productos.map((p) => {
    const tracked = stockMap.get(p.id);
    const s = stockDeCaja(tracked ?? null, p.umbralStockBajo);
    return {
      id: p.id,
      nombre: p.nombre,
      precio: p.precioVentaCentavos,
      categoria: p.categoria,
      icono: resolveProductIcon(p.icono, p.categoria),
      tint: PRODUCT_BG_COLORS[p.colorFondo],
      codigo: p.sku,
      quedan: tracked !== undefined && s.existencias <= s.umbral ? s.existencias : null,
      pendiente: p.estadoRevision === 'pendiente',
    };
  });
}

/** «Todos» and every category present, in catalogue order; one category shows no chips. */
export function categoriasDe(productos: readonly ProductoCobrar[]): readonly string[] {
  const vistas = [...new Set(productos.map((p) => p.categoria))];
  return vistas.length > 1 ? [TODOS, ...vistas] : [];
}

/** By category, then by the typed text against the name, the code or the price. */
export function filtrarCatalogo(
  productos: readonly ProductoCobrar[],
  categoria: string,
  query: string,
): readonly ProductoCobrar[] {
  return productos
    .filter((p) => categoria === TODOS || p.categoria === categoria)
    .filter((p) => matches(query, p.nombre, p.codigo ?? '', formatMoney(p.precio)));
}

/**
 * Every product a scanned or typed code names, in catalogue order (ADR-150):
 * compared by `codigoCanonico`, so a UPC-A and its EAN-13 form meet. Two or
 * more means the catalogue has a duplicate and the escáner asks which one.
 */
export function productosPorCodigo(
  productos: readonly ProductoCobrar[],
  codigo: string,
): readonly ProductoCobrar[] {
  return productos.filter((p) => mismoCodigo(p.codigo, codigo));
}
