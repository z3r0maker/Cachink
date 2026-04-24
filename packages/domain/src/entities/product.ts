/**
 * Product (Producto) — inventariable unit. Categories and units come from
 * INV_CAT and INV_UNIDAD in CLAUDE.md §9. Stock level is derived from the
 * MovimientoInventario ledger, not stored here; `umbralStockBajo` feeds the
 * Director's end-of-day stock-low notification.
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

export const ProductSchema = z
  .object({
    id: ulidField<ProductId>(),
    nombre: z.string().min(1).max(120),
    sku: z.string().min(1).max(64).nullable(),
    categoria: InventoryCategoryEnum,
    costoUnitCentavos: moneyField,
    unidad: InventoryUnitEnum,
    umbralStockBajo: z.number().int().min(0).default(3),
  })
  .merge(auditSchema);

export type Product = z.infer<typeof ProductSchema>;

export const NewProductSchema = z.object({
  nombre: z.string().min(1).max(120),
  sku: z.string().min(1).max(64).optional(),
  categoria: InventoryCategoryEnum,
  costoUnitCentavos: moneyField,
  unidad: InventoryUnitEnum,
  umbralStockBajo: z.number().int().min(0).optional(),
  businessId: ulidField<BusinessId>(),
});

export type NewProduct = z.infer<typeof NewProductSchema>;
