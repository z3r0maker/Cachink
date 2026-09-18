import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { PLATFORM_FLAG_KEYS } from '@xangarro/domain';

import { FlagError } from '@/server/flags/errors';
import { InMemoryPlatformFlags } from '@/server/flags/memory';
import { flagHistory, listFlags } from '@/server/flags/overview';
import { setPlatformFlag } from '@/server/flags/set-flag';

import { flagSetup } from './support/flags';
import { bid, STAFF } from './support/tenants';

describe('listFlags', () => {
  it('shows every key; an untouched key shows its default and no last change', async () => {
    const { store } = flagSetup();
    const { rows, tenantCount } = await listFlags({ store });
    assert.deepEqual(
      rows.map((r) => r.key),
      [...PLATFORM_FLAG_KEYS],
    );
    const stock = rows.find((r) => r.key === 'stock');
    assert.equal(stock?.state.mode, 'on');
    assert.equal(stock?.state.source, 'default');
    assert.equal(stock?.defaultOn, true);
    assert.equal(stock?.lastChange, null);
    assert.equal(tenantCount, 3);
  });

  it('a changed key shows its latest state, reason and author name', async () => {
    const { deps, store } = flagSetup();
    await setPlatformFlag(deps, { key: 'merma', mode: 'on', reason: 'Lanzamiento' });
    await setPlatformFlag(deps, {
      key: 'merma',
      mode: 'allowlist',
      allowlist: [bid(1)],
      reason: 'Volvemos a beta',
    });
    const merma = (await listFlags({ store })).rows.find((r) => r.key === 'merma');
    assert.equal(merma?.state.mode, 'allowlist');
    assert.deepEqual(merma?.state.allowlistBusinessIds, [bid(1)]);
    assert.equal(merma?.lastChange?.reason, 'Volvemos a beta');
    assert.equal(merma?.lastChange?.by, 'Ana Soporte');
  });

  it('an author no longer on the allowlist shows as their id', async () => {
    const { deps, store } = flagSetup();
    store.names.clear();
    await setPlatformFlag(deps, { key: 'merma', mode: 'on', reason: 'Lanzamiento' });
    const merma = (await listFlags({ store })).rows.find((r) => r.key === 'merma');
    assert.equal(merma?.lastChange?.by, STAFF);
  });

  it('a store failure surfaces as STORE_FAILED', async () => {
    const broken = new InMemoryPlatformFlags();
    broken.current = () => Promise.reject(new Error('connection refused'));
    await assert.rejects(
      listFlags({ store: broken }),
      (e: unknown) => e instanceof FlagError && e.code === 'STORE_FAILED',
    );
  });
});

describe('flagHistory', () => {
  it('lists one key newest first, with author names', async () => {
    const { deps, store } = flagSetup();
    await setPlatformFlag(deps, { key: 'merma', mode: 'on', reason: 'Primero' });
    await setPlatformFlag(deps, {
      key: 'stock',
      mode: 'off',
      reason: 'Otro',
      confirmacion: 'apagar',
    });
    await setPlatformFlag(deps, {
      key: 'merma',
      mode: 'off',
      reason: 'Segundo',
      confirmacion: 'apagar',
    });
    const h = await flagHistory({ store }, 'merma');
    assert.deepEqual(
      h.map((e) => [e.reason, e.by]),
      [
        ['Segundo', 'Ana Soporte'],
        ['Primero', 'Ana Soporte'],
      ],
    );
  });

  it('an unknown key is refused, not queried', async () => {
    const { store } = flagSetup();
    await assert.rejects(
      flagHistory({ store }, 'teleport'),
      (e: unknown) => e instanceof FlagError && e.code === 'VALIDATION',
    );
  });
});
