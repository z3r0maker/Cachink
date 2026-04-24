/**
 * Business entity — the root tenant under which every other row is scoped.
 *
 * Each device belongs to exactly one Business in Phase 1 (CLAUDE.md §1), but
 * the schema already carries `businessId` on every row so multi-business
 * support can land later without a migration.
 */

import { z } from 'zod';
import type { BusinessId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';

export const BusinessSchema = z
  .object({
    id: ulidField<BusinessId>(),
    nombre: z.string().min(1).max(120),
    regimenFiscal: z.string().min(1).max(80),
    isrTasa: z.number().min(0).max(1),
    logoUrl: z.string().url().nullable(),
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
