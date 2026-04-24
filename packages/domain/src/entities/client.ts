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
  businessId: ulidField<BusinessId>(),
});

export type NewClient = z.infer<typeof NewClientSchema>;
