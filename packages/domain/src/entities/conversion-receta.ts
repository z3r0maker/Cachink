/**
 * ConversionReceta — recipe for converting materia prima to product.
 *
 * Example: 1 bag of coffee (cantidadOrigen=1) → 10 cups (cantidadResultante=10).
 * Phase 8 of the Feature Flags plan.
 */

import { z } from 'zod';
import type { BusinessId, ConversionRecetaId, ProductId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';

export const ConversionRecetaSchema = z
  .object({
    id: ulidField<ConversionRecetaId>(),
    materiaPrimaId: ulidField<ProductId>(),
    productoResultanteId: ulidField<ProductId>(),
    cantidadOrigen: z.number().int().positive(),
    cantidadResultante: z.number().int().positive(),
  })
  .merge(auditSchema);

export type ConversionReceta = z.infer<typeof ConversionRecetaSchema>;

export const NewConversionRecetaSchema = z.object({
  materiaPrimaId: ulidField<ProductId>(),
  productoResultanteId: ulidField<ProductId>(),
  cantidadOrigen: z.number().int().positive(),
  cantidadResultante: z.number().int().positive(),
  businessId: ulidField<BusinessId>(),
});

export type NewConversionReceta = z.infer<typeof NewConversionRecetaSchema>;
