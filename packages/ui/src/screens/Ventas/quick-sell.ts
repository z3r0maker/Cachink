/**
 * Quick-sell helpers — pure functions for the inline POS tap-to-sell flow.
 *
 * `deriveVentaCategoria` auto-maps producto tipo → sale categoria.
 * `buildQuickSellPayload` constructs a NewSale from a Product tap.
 *
 * ADR-048: every sale now references a producto — the null-producto
 * branch has been removed.
 */

import { type IsoDate, type NewSale, type PaymentMethod, type SaleCategory } from '@cachink/domain';
import type { Business, Product } from '@cachink/domain';

/** Derive SaleCategory from a Product's tipo. */
export function deriveVentaCategoria(
  producto: Product,
  _business: Business,
): SaleCategory {
  return producto.tipo === 'servicio' ? 'Servicio' : 'Producto';
}

export interface QuickSellInput {
  readonly producto: Product;
  readonly business: Business;
  readonly fecha: IsoDate;
  readonly metodo?: PaymentMethod;
}

/** Build a NewSale payload from a quick-sell tap on a product card. */
export function buildQuickSellPayload(input: QuickSellInput): NewSale {
  const { producto, business, fecha, metodo } = input;
  return {
    fecha,
    concepto: producto.nombre,
    categoria: deriveVentaCategoria(producto, business),
    monto: producto.precioVentaCentavos,
    metodo: metodo ?? 'Efectivo',
    productoId: producto.id,
    cantidad: 1,
    businessId: business.id,
  } as NewSale;
}
