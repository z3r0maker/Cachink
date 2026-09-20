import { sql } from 'drizzle-orm';

import { devices } from '../schema/index.js';

/**
 * The one definition of when a device was "last seen" (N-06's consolidation):
 * the greater of its last push and last pull, with `created_at` as the
 * floor — a device that never synced was still seen when it was linked.
 * Both backoffice readers (tenants list, tenant detail) build on this
 * fragment; the Studio doc query mirrors it in prose. Any change here is a
 * change to every "sin sincronizar" surface at once.
 */
export const deviceLastSeen = sql`greatest(${devices.lastPushAt}, ${devices.lastPullAt})`;

/** The stale rule over the same fragment: seen before `before`, or never. */
export const deviceStaleBefore = (before: string) =>
  sql`coalesce(${deviceLastSeen}, ${devices.createdAt}) < ${before}::timestamptz`;
