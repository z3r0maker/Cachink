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
    /**
     * Fiscal data for CFDI (README Q15, P-08). Nullable: collected when the
     * owner has it, never required to sell. Validated by `@xangarro/domain`'s
     * fiscal rules where it is entered; stored as typed (normalised).
     */
    rfc: z.string().max(13).nullable().default(null),
    razonSocial: z.string().max(254).nullable().default(null),
    codigoPostal: z.string().max(5).nullable().default(null),
    /** c_UsoCFDI; null means the CFDI router's default, G03. */
    usoCfdi: z.string().max(4).nullable().default(null),
    /** ISR rate in basis points (3000 = 30%). */
    isrTasa: z.number().int().min(0).max(10_000),
    logoUrl: z.string().url().nullable(),
    tipoNegocio: TipoNegocioEnum.default('mixto'),
    categoriaVentaPredeterminada: SaleCategoryEnum.default('Producto'),
    atributosProducto: z.array(AttrDefSchema).default([]),
    /** JSON array of enabled payment method keys. Defaults to all 4. */
    enabledPaymentMethods: z.string().default('["Efectivo","Transferencia","Tarjeta","QR/CoDi"]'),
    /** JSON string storing business feature flags. Parsed by callers. */
    featureFlags: z
      .string()
      .default(
        '{"stock":true,"conversionMateriaPrima":false,"conversionAutomatica":false,"auditoriaInventario":false,"merma":false,"ventasCredito":false}',
      ),
  })
  .merge(auditSchema);

export type Business = z.infer<typeof BusinessSchema>;

/** Input payload for creating a new Business — id + audit fields filled by the caller. */
export const NewBusinessSchema = BusinessSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  // A business starts without fiscal data; it is filled in later (P-08).
}).partial({ rfc: true, razonSocial: true, codigoPostal: true, usoCfdi: true });

export type NewBusiness = z.infer<typeof NewBusinessSchema>;
