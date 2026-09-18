import 'server-only';

import type { DOWN_TABLES, HYBRID_TABLES } from '@xangarro/contracts';
import { logChange } from '@xangarro/data-pg';

import type { Tx } from '../db';

/**
 * Tell the devices a row changed.
 *
 * Not every portal write needs this, and knowing which is the whole point of
 * the type below. `notices` and `activation_codes` exist only in the cloud —
 * no device has those tables, so logging a change to them would enqueue work
 * for a puller that can do nothing with it. `businesses`, `employees` and the
 * rest of `DOWN_TABLES` are pulled by every device, and `products`/`clients`
 * are HYBRID: created on a phone, corrected here, and the correction only
 * arrives because a row lands here for the puller to find (contract §5, §8).
 *
 * The union is derived from `@xangarro/contracts` rather than retyped, so a
 * table moving between scopes is a compile error at every call site instead of
 * a silently unsynced write.
 */
export type SyncedByPortal = (typeof DOWN_TABLES)[number] | (typeof HYBRID_TABLES)[number];

/**
 * Always call this inside the same transaction as the write it describes.
 *
 * A row must never change without the record the device pulls, nor be
 * announced as changed when the write rolled back — and a separate transaction
 * gives you both failures.
 */
export async function recordChange(
  tx: Tx,
  businessId: string,
  tableName: SyncedByPortal,
  rowId: string,
  op: 'insert' | 'update',
): Promise<void> {
  await logChange(tx, businessId, tableName, rowId, op);
}
