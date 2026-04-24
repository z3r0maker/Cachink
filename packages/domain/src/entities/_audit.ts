/**
 * Shared audit-field schema for Zod entities.
 *
 * CLAUDE.md §9 mandates `business_id`, `device_id`, `created_at`,
 * `updated_at`, and `deleted_at` on every synced table. These columns are
 * invariant across entities so we factor them into a single reusable shape.
 */

import { z } from 'zod';
import type { BusinessId, DeviceId } from '../ids/index.js';
import type { IsoTimestamp } from '../dates/index.js';
import { ulidField } from './_ulid-field.js';

/** ISO 8601 UTC timestamp, e.g. "2026-04-23T15:30:00.000Z". */
export const isoTimestampField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
  .transform((v) => v as IsoTimestamp);

/** Audit columns every synced table carries per CLAUDE.md §9. */
export const auditSchema = z.object({
  businessId: ulidField<BusinessId>(),
  deviceId: ulidField<DeviceId>(),
  createdAt: isoTimestampField,
  updatedAt: isoTimestampField,
  deletedAt: isoTimestampField.nullable(),
});

export type AuditFields = z.infer<typeof auditSchema>;
