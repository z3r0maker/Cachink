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

/** Product icon — curated Lucide icon names for visual identification. */
export const ProductIconEnum = z.enum([
  // Alimentos
  'beef', 'apple', 'cake', 'candy', 'cookie', 'croissant', 'drumstick',
  'egg', 'fish', 'ice-cream-cone', 'leaf', 'nut', 'pizza', 'popcorn',
  'salad', 'sandwich', 'soup',
  // Bebidas
  'beer', 'coffee', 'cup-soda', 'glass-water', 'grape', 'martini',
  'milk', 'wine',
  // Comercio
  'gift', 'gem', 'shirt', 'sport-shoe', 'shopping-bag', 'store', 'tag',
  'watch',
  // Servicios
  'car', 'hammer', 'hard-hat', 'paintbrush', 'plug', 'scissors',
  'spray-can', 'stethoscope', 'wrench',
  // Belleza & Cuidado
  'bath', 'sparkles', 'sun', 'droplets', 'heart',
  // Hogar & Oficina
  'armchair', 'book', 'briefcase', 'lamp', 'pen-tool', 'printer',
  // General
  'archive', 'box', 'clipboard-list', 'flower-2', 'music', 'package',
  'palette', 'paw-print', 'pill', 'star', 'ticket', 'trophy', 'zap',
]);
export type ProductIcon = z.infer<typeof ProductIconEnum>;

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
    /** Optional product icon for visual identification. */
    icono: ProductIconEnum.nullable().default(null),
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
  icono: ProductIconEnum.nullable().optional(),
  businessId: ulidField<BusinessId>(),
});

export type NewProduct = z.infer<typeof NewProductSchema>;
