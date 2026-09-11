/**
 * `GET /sync/pull?since=<serverSeq>` (docs/plan/02-contracts.md §5).
 */

import { z } from 'zod';
import { ReferenceTablesSchema } from './activate.js';
import { SignedEntitlementSchema } from './entitlement.js';

export const PullQuerySchema = z.object({
  since: z.coerce.number().int().nonnegative().default(0),
});
export type PullQuery = z.infer<typeof PullQuerySchema>;

export const PullResponseSchema = z.object({
  serverSeq: z.number().int().nonnegative(),
  serverTime: z.string().datetime(),
  entitlement: SignedEntitlementSchema,
  tables: ReferenceTablesSchema,
  /** Highest serverSeq durably stored for THIS device's pushes — the retention purge bound (A-11). */
  acknowledgedThrough: z.number().int().nonnegative(),
});
export type PullResponse = z.infer<typeof PullResponseSchema>;
