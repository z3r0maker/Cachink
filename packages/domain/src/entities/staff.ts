/**
 * Staff of the internal admin console (ADR-063) — a **portal-only** entity
 * under ADR-060: it lives only in Postgres, is absent from `scope.ts`, and no
 * device ever reads it.
 *
 * - `StaffMember` is the allowlist. Signing in to Supabase Auth proves who
 *   someone is; a live row here is what makes them staff. `userId` is the
 *   `auth.users` uuid — a different id space from our ULIDs.
 * - `StaffAuditEntry` is one row per mutation a staff member performs. It is
 *   append-only; `businessId` is null for actions that touch no tenant.
 *
 * The branded ids are declared here rather than in `ids/index.ts` because
 * nothing outside the admin console mints or passes them.
 */

import { z } from 'zod';

import type { BusinessId, Ulid } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';

export type StaffMemberId = Ulid & { readonly __entity: 'StaffMember' };
export type StaffAuditEntryId = Ulid & { readonly __entity: 'StaffAuditEntry' };

const isoInstant = z.iso.datetime({ offset: true });

export const StaffMemberSchema = z.object({
  id: ulidField<StaffMemberId>(),
  /** `auth.users.id` (uuid). */
  userId: z.uuid(),
  email: z.email(),
  nombre: z.string().min(1),
  createdAt: isoInstant,
  /** Revoking removes access without losing the audit trail's referent. */
  revokedAt: isoInstant.nullable(),
});
export type StaffMember = z.infer<typeof StaffMemberSchema>;

/**
 * `area.verbo_en_snake_case`, e.g. `tenant.extender_prueba`. A fixed shape so
 * the audit log can be filtered by area without parsing free text.
 */
export const StaffActionSchema = z.string().regex(/^[a-z]+(\.[a-z][a-z_]*)+$/);
export type StaffAction = z.infer<typeof StaffActionSchema>;

export const StaffAuditEntrySchema = z.object({
  id: ulidField<StaffAuditEntryId>(),
  staffId: ulidField<StaffMemberId>(),
  action: StaffActionSchema,
  businessId: ulidField<BusinessId>().nullable(),
  payload: z.record(z.string(), z.unknown()),
  at: isoInstant,
});
export type StaffAuditEntry = z.infer<typeof StaffAuditEntrySchema>;
