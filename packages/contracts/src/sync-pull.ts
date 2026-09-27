/**
 * `GET /sync/pull?since=<serverSeq>` (docs/plan/02-contracts.md §5).
 */

import { z } from 'zod';
import { ReferenceTablesSchema } from './activate.js';
import { SignedEntitlementSchema } from './entitlement.js';
import { SnapshotInfoSchema } from './snapshot.js';

/**
 * C-12's unsigned `usage` block: server-computed, informational, riding
 * beside the signed entitlement so it never forces a re-sign. `null` = no
 * recompute has landed yet (the field omits in that case).
 */
export const UsageBlockSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  transactions: z.number().int().nonnegative(),
  products: z.number().int().nonnegative(),
  computedAt: z.string().datetime(),
});
export type UsageBlock = z.infer<typeof UsageBlockSchema>;

export const PullQuerySchema = z.object({
  since: z.coerce.number().int().nonnegative().default(0),
  /**
   * C-23: `start` begins a paged snapshot bootstrap, any other value continues
   * one (the `next` a page handed out). Absent with `since=0` = the legacy
   * full bootstrap an older device asks for.
   */
  snapshot: z.string().min(1).max(512).optional(),
});
export type PullQuery = z.infer<typeof PullQuerySchema>;

export const PullResponseSchema = z.object({
  serverSeq: z.number().int().nonnegative(),
  serverTime: z.string().datetime(),
  entitlement: SignedEntitlementSchema,
  usage: UsageBlockSchema.optional(),
  tables: ReferenceTablesSchema,
  /** Highest serverSeq durably stored for THIS device's pushes — the retention purge bound (A-11). */
  acknowledgedThrough: z.number().int().nonnegative(),
  /** C-23: present on snapshot pages only. */
  snapshot: SnapshotInfoSchema.optional(),
});
export type PullResponse = z.infer<typeof PullResponseSchema>;
