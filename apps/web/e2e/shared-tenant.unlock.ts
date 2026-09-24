import { test as release } from './test';

import { unlockSharedTenant } from './shared-tenant';

/**
 * The `unlock` project: one step, between the parallel phase and the serial one.
 *
 * Everything after it — `serial`, `operador`, `sync` — owns the seeded tenant
 * one worker at a time, so the write lock the global setup put on Taquería Don
 * Pedro comes off here. See `shared-tenant.ts` for why it goes on.
 */
release('the viewport phase is over: the seeded tenant takes writes again', async () => {
  await unlockSharedTenant('serial projects');
});
