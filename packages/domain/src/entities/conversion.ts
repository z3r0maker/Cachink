/**
 * Conversion — executed conversion record.
 *
 * Links the recipe, both inventory movements (salida on materia prima,
 * entrada on producto resultante), and the quantities used.
 * Phase 8 of the Feature Flags plan.
 */

import { z } from 'zod';
import type {
  ConversionId,
  ConversionRecetaId,
  InventoryMovementId,
  ProductId,
} from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';

export const ConversionSchema = z
  .object({
    id: ulidField<ConversionId>(),
    recetaId: ulidField<ConversionRecetaId>(),
    materiaPrimaId: ulidField<ProductId>(),
    productoResultanteId: ulidField<ProductId>(),
    cantidadOrigenUsada: z.number().int().positive(),
    cantidadResultanteCreada: z.number().int().positive(),
    movimientoSalidaId: ulidField<InventoryMovementId>(),
    movimientoEntradaId: ulidField<InventoryMovementId>(),
  })
  .merge(auditSchema);

export type Conversion = z.infer<typeof ConversionSchema>;
