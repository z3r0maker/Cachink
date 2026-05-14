/**
 * Product (Producto) — catalogue item. May represent a physical product
 * (with or without stock tracking) or a service.
 *
 * Categories and units come from INV_CAT and INV_UNIDAD in CLAUDE.md §9.
 * Stock level is derived from the MovimientoInventario ledger, not stored
 * here; `umbralStockBajo` feeds the Director's end-of-day stock-low
 * notification.
 *
 * UXD-R3 additions (ADR-043):
 *   - `tipo` — discriminator: 'producto' | 'servicio'.
 *   - `seguirStock` — opt-in stock tracking; forced false for servicios.
 *   - `precioVentaCentavos` — required for quick-sell flow.
 *   - `atributos` — sparse key/value map for custom attributes.
 */

import { z } from 'zod';
import type { BusinessId, ProductId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { moneyField } from './_fields.js';

export const InventoryCategoryEnum = z.enum([
  'Materia Prima',
  'Producto Terminado',
  'Empaque',
  'Herramienta',
  'Insumo',
  'Otro',
]);
export type InventoryCategory = z.infer<typeof InventoryCategoryEnum>;

export const InventoryUnitEnum = z.enum([
  'pza',
  'kg',
  'lt',
  'm',
  'caja',
  'bolsa',
  'rollo',
  'par',
  'otro',
]);
export type InventoryUnit = z.infer<typeof InventoryUnitEnum>;

/** Discriminator: physical product vs service (ADR-043). */
export const ProductoTipoEnum = z.enum(['producto', 'servicio']);
export type ProductoTipo = z.infer<typeof ProductoTipoEnum>;

/** Phase 8: how the product is used in the business. */
export const UsoProductoEnum = z.enum(['venta', 'materia-prima', 'ambos']);
export type UsoProducto = z.infer<typeof UsoProductoEnum>;

/** Soft background color for visual categorization (default: white). */
export const ProductColorEnum = z.enum([
  'white', 'yellow', 'green', 'blue', 'pink', 'purple', 'peach', 'gray',
]);
export type ProductColor = z.infer<typeof ProductColorEnum>;

export const ProductSchema = z
  .object({
    id: ulidField<ProductId>(),
    nombre: z.string().min(1).max(120),
    sku: z.string().min(1).max(64).nullable(),
    categoria: InventoryCategoryEnum,
    costoUnitCentavos: moneyField,
    unidad: InventoryUnitEnum,
    umbralStockBajo: z.number().int().min(0).default(3),
    tipo: ProductoTipoEnum,
    seguirStock: z.boolean(),
    precioVentaCentavos: moneyField,
    atributos: z.record(z.string(), z.string()).default({}),
    colorFondo: ProductColorEnum.default('white'),
    /** Phase 8: venta, materia-prima, or ambos. */
    usoProducto: UsoProductoEnum.default('venta'),
  })
  .merge(auditSchema)
  .refine((v) => v.tipo === 'producto' || v.seguirStock === false, {
    message: "tipo='servicio' implies seguirStock=false",
    path: ['seguirStock'],
  });

export type Product = z.infer<typeof ProductSchema>;

export const NewProductSchema = z.object({
  nombre: z.string().min(1).max(120),
  sku: z.string().min(1).max(64).optional(),
  categoria: InventoryCategoryEnum,
  costoUnitCentavos: moneyField,
  unidad: InventoryUnitEnum,
  umbralStockBajo: z.number().int().min(0).optional(),
  tipo: ProductoTipoEnum.default('producto'),
  seguirStock: z.boolean().default(true),
  precioVentaCentavos: moneyField,
  atributos: z.record(z.string(), z.string()).default({}),
  colorFondo: ProductColorEnum.default('white'),
  usoProducto: UsoProductoEnum.default('venta'),
  businessId: ulidField<BusinessId>(),
});

export type NewProduct = z.infer<typeof NewProductSchema>;
