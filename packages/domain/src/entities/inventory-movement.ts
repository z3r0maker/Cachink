/**
 * InventoryMovement (MovimientoInventario) — a single entrada or salida on a
 * Producto. Running stock is derived by summing movements (entradas +, salidas -).
 *
 * `motivo` is constrained to the subset valid for the movement's `tipo` via
 * a cross-field refine — entradas can't be labelled "Venta", salidas can't
 * be labelled "Compra a proveedor", etc.
 */

import { z } from 'zod';
import type { BusinessId, InventoryMovementId, ProductId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { isoDateField, moneyField } from './_fields.js';

export const MovementTypeEnum = z.enum(['entrada', 'salida']);
export type MovementType = z.infer<typeof MovementTypeEnum>;

export const EntryReasonEnum = z.enum([
  'Compra a proveedor',
  'Devolución de cliente',
  'Ajuste de inventario',
  'Producción',
  'Otro',
]);
export type EntryReason = z.infer<typeof EntryReasonEnum>;

export const ExitReasonEnum = z.enum([
  'Venta',
  'Uso en producción',
  'Merma / daño',
  'Muestra',
  'Ajuste de inventario',
  'Otro',
]);
export type ExitReason = z.infer<typeof ExitReasonEnum>;

const ENTRY_REASONS = new Set<string>(EntryReasonEnum.options);
const EXIT_REASONS = new Set<string>(ExitReasonEnum.options);

export const InventoryMovementSchema = z
  .object({
    id: ulidField<InventoryMovementId>(),
    productoId: ulidField<ProductId>(),
    fecha: isoDateField,
    tipo: MovementTypeEnum,
    cantidad: z.number().int().positive(),
    costoUnitCentavos: moneyField,
    motivo: z.string().min(1).max(80),
    nota: z.string().max(500).nullable(),
  })
  .merge(auditSchema)
  .refine(
    (v) =>
      (v.tipo === 'entrada' && ENTRY_REASONS.has(v.motivo)) ||
      (v.tipo === 'salida' && EXIT_REASONS.has(v.motivo)),
    {
      message: 'motivo must match the allowed values for the movement tipo',
      path: ['motivo'],
    },
  );

export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;

export const NewInventoryMovementSchema = z.object({
  productoId: ulidField<ProductId>(),
  fecha: isoDateField,
  tipo: MovementTypeEnum,
  cantidad: z.number().int().positive(),
  costoUnitCentavos: moneyField,
  motivo: z.string().min(1).max(80),
  nota: z.string().max(500).optional(),
  businessId: ulidField<BusinessId>(),
});

export type NewInventoryMovement = z.infer<typeof NewInventoryMovementSchema>;
