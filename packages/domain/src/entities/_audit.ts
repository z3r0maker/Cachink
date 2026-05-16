/**
 * Shared audit-field schema for Zod entities.
 *
 * CLAUDE.md §9 mandates `business_id`, `device_id`, `created_at`,
 * `updated_at`, and `deleted_at` on every synced table. These columns are
 * invariant across entities so we factor them into a single reusable shape.
 *
 * Phase 2 addition: `created_by_user_id` — nullable for migration compat
 * (old records pre-dating user management have null). Uses `.default(null)`
 * so New* input schemas don't require callers to pass it explicitly.
 */

import { z } from 'zod';
import type { BusinessId, DeviceId, UserId } from '../ids/index.js';
import type { IsoTimestamp } from '../dates/index.js';
import { ulidField } from './_ulid-field.js';

/** ISO 8601 UTC timestamp, e.g. "2026-04-23T15:30:00.000Z". */
export const isoTimestampField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
  .transform((v) => v as IsoTimestamp);

/**
 * Nullable ULID field that defaults to null when omitted.
 * Used for `createdByUserId` so existing code that creates New* inputs
 * doesn't need to explicitly pass `createdByUserId: null`.
 */
const optionalUserIdField = z
  .string()
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/)
  .nullable()
  .default(null) as unknown as z.ZodDefault<z.ZodNullable<z.ZodType<UserId>>>;

/** Audit columns every synced table carries per CLAUDE.md §9. */
export const auditSchema = z.object({
  businessId: ulidField<BusinessId>(),
  deviceId: ulidField<DeviceId>(),
  createdByUserId: optionalUserIdField,
  createdAt: isoTimestampField,
  updatedAt: isoTimestampField,
  deletedAt: isoTimestampField.nullable(),
});

export type AuditFields = z.infer<typeof auditSchema>;
