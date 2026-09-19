/**
 * Client (Cliente) — Phase 1 introduces a deliberately minimal Client entity
 * so the Crédito payment method can function (CLAUDE.md §1). Not a CRM: no
 * segments, no marketing, no loyalty — see CLAUDE.md §13 for exclusions.
 *
 * Phone validation is loose (Mexican landlines, mobiles, and international
 * numbers all need to pass). Email is optional and uses the standard RFC
 * 5322-ish check shipped with Zod.
 */

import { z } from 'zod';
import type { BusinessId, ClientId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { estadoRevisionField } from './_revision.js';
import { moneyField } from './_fields.js';
import { isValidRfc, normalizeRfc } from '../fiscal/rfc.js';

/**
 * RFC for a cliente (N-16): optional, normalised to upper case and validated
 * with the fiscal check (`fiscal/rfc.ts`). Nullish — absent means "unknown",
 * which is every pre-0020 row and every row the phone writes (the SQLite half
 * of the column lands with the app branch, C-15-style).
 */
const rfcField = z
  .string()
  .transform((v) => normalizeRfc(v))
  .refine((v) => isValidRfc(v), { message: 'RFC inválido' });

export const ClientSchema = z
  .object({
    id: ulidField<ClientId>(),
    nombre: z.string().min(1).max(120),
    telefono: z
      .string()
      .regex(/^[\d\s+\-()]{7,20}$/)
      .nullable(),
    email: z.string().email().nullable(),
    nota: z.string().max(500).nullable(),
    rfc: rfcField.nullish(),
    /** Owner-set credit line (ADR-074); null = no limit studied yet. */
    limiteCentavos: moneyField.nullable().default(null),
    /** Owner-set credit term in days (ADR-074). */
    plazoDias: z.number().int().min(0).nullable().default(null),
    /** «Creado en caja» review (ADR-074); defaults to `aprobado`. */
    estadoRevision: estadoRevisionField,
    /** When merged, the client this row fused into (ADR-074). */
    fusionadoConId: ulidField<ClientId>().nullable().default(null),
  })
  .merge(auditSchema);

export type Client = z.infer<typeof ClientSchema>;

export const NewClientSchema = z.object({
  nombre: z.string().min(1).max(120),
  telefono: z
    .string()
    .regex(/^[\d\s+\-()]{7,20}$/)
    .optional(),
  email: z.string().email().optional(),
  nota: z.string().max(500).optional(),
  rfc: rfcField.optional(),
  /** A client created at the register arrives `pendiente` (ADR-074). */
  estadoRevision: estadoRevisionField,
  limiteCentavos: moneyField.nullish(),
  plazoDias: z.number().int().min(0).nullish(),
  fusionadoConId: ulidField<ClientId>().nullish(),
  businessId: ulidField<BusinessId>(),
});

export type NewClient = z.infer<typeof NewClientSchema>;
