/**
 * AuditoriaInventario — physical inventory count record.
 *
 * Each audit is created as a draft ('borrador'), with product lines
 * pre-loaded. The user counts items and fills in stockReal. When
 * finalized, adjustment movements are created for discrepancies.
 *
 * Phase 10 of the Feature Flags plan.
 */

import { z } from 'zod';
import type { AuditoriaInventarioId, ProductId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { isoDateField } from './_fields.js';

export const AuditoriaEstadoEnum = z.enum(['borrador', 'finalizada']);
export type AuditoriaEstado = z.infer<typeof AuditoriaEstadoEnum>;

export const AuditoriaLineaSchema = z.object({
  productoId: ulidField<ProductId>(),
  productoNombre: z.string(),
  stockSistema: z.number().int(),
  stockReal: z.number().int().nullable(),
  diferencia: z.number().int().nullable(),
});
export type AuditoriaLinea = z.infer<typeof AuditoriaLineaSchema>;

export const AuditoriaInventarioSchema = z
  .object({
    id: ulidField<AuditoriaInventarioId>(),
    fecha: isoDateField,
    estado: AuditoriaEstadoEnum,
    /** JSON-encoded AuditoriaLinea[] in DB. */
    lineas: z.string(),
    totalDiscrepancias: z.number().int(),
    totalProductos: z.number().int(),
    productosContados: z.number().int(),
  })
  .merge(auditSchema);

export type AuditoriaInventario = z.infer<typeof AuditoriaInventarioSchema>;
