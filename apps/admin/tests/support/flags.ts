import type { PlatformFlagEventId } from '@xangarro/domain';

import { InMemoryPlatformFlags } from '@/server/flags/memory';
import type { SetFlagDeps } from '@/server/flags/set-flag';

import { directory, NOW, STAFF, tenant } from './tenants';

/** Deterministic event ids: a fixed prefix plus a counter. */
export function eventIds(): () => PlatformFlagEventId {
  let n = 0;
  return () => {
    n += 1;
    return `01HZ8XQN9GZJXV8AKQ5X0E${String(n).padStart(4, '0')}` as PlatformFlagEventId;
  };
}

/** Three tenants on the platform; the clock advances a minute per call. */
export function flagSetup(store = new InMemoryPlatformFlags()) {
  store.tenants = 3;
  store.names.set(STAFF, 'Ana Soporte');
  let tick = 0;
  const deps: SetFlagDeps = {
    store,
    directory: directory(tenant(1), tenant(2), tenant(3)),
    staffId: STAFF,
    now: () => new Date(NOW.getTime() + 60_000 * tick++),
    newId: eventIds(),
  };
  return { deps, store };
}
