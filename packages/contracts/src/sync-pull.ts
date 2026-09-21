/**
 * `GET /sync/pull?since=<serverSeq>` (docs/plan/02-contracts.md §5).
 */

import { z } from 'zod';
import { ReferenceTablesSchema } from './activate.js';
import { SignedEntitlementSchema } from './entitlement.js';

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
});
export type PullResponse = z.infer<typeof PullResponseSchema>;
