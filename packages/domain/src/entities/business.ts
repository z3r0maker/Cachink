/**
 * Business entity — the root tenant under which every other row is scoped.
 *
 * Each device belongs to exactly one Business in Phase 1 (CLAUDE.md §1), but
 * the schema already carries `businessId` on every row so multi-business
 * support can land later without a migration.
 *
 * UXD-R3 additions (ADR-043):
 *   - `tipoNegocio` — one of four archetypes that drive UI adaptation.
 *   - `categoriaVentaPredeterminada` — default SaleCategory for quick-sell.
 *   - `atributosProducto` — custom attribute definitions for the catalogue.
 */

import { z } from 'zod';
import type { BusinessId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { SaleCategoryEnum } from './sale.js';

/** Business archetype — drives UI adaptation for catalogue + stock. */
export const TipoNegocioEnum = z.enum([
  'producto-con-stock',
  'producto-sin-stock',
  'servicio',
  'mixto',
]);
export type TipoNegocio = z.infer<typeof TipoNegocioEnum>;

/** Definition of a custom attribute attached to products for this business. */
export const AttrDefSchema = z.object({
  clave: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z_][a-z0-9_]*$/),
  label: z.string().min(1).max(60),
  tipo: z.enum(['texto', 'select']),
  opciones: z.array(z.string()).optional(),
  obligatorio: z.boolean().default(false),
});
export type AttrDef = z.infer<typeof AttrDefSchema>;

export const BusinessSchema = z
  .object({
    id: ulidField<BusinessId>(),
    nombre: z.string().min(1).max(120),
    regimenFiscal: z.string().min(1).max(80),
    isrTasa: z.number().min(0).max(1),
    logoUrl: z.string().url().nullable(),
    tipoNegocio: TipoNegocioEnum.default('mixto'),
    categoriaVentaPredeterminada: SaleCategoryEnum.default('Producto'),
    atributosProducto: z.array(AttrDefSchema).default([]),
  })
  .merge(auditSchema);

export type Business = z.infer<typeof BusinessSchema>;

/** Input payload for creating a new Business — id + audit fields filled by the caller. */
export const NewBusinessSchema = BusinessSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type NewBusiness = z.infer<typeof NewBusinessSchema>;
