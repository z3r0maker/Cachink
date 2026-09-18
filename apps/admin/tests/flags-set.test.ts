import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { FlagError } from '@/server/flags/errors';
import { CONFIRM_OFF } from '@/server/flags/labels';
import { InMemoryPlatformFlags } from '@/server/flags/memory';
import { setPlatformFlag } from '@/server/flags/set-flag';

import { flagSetup } from './support/flags';
import { bid, NOW, STAFF } from './support/tenants';

const rejectsWith = (p: Promise<unknown>, code: string) =>
  assert.rejects(p, (e: unknown) => e instanceof FlagError && e.code === code);

const REASON = 'Lanzamiento general';

describe('setPlatformFlag', () => {
  it('releases a key: one event, authored and timed, before = the code default', async () => {
    const { deps, store } = flagSetup();
    const change = await setPlatformFlag(deps, { key: 'merma', mode: 'on', reason: REASON });
    assert.equal(change.event.key, 'merma');
    assert.equal(change.event.mode, 'on');
    assert.equal(change.event.updatedBy, STAFF);
    assert.equal(change.event.updatedAt, NOW.toISOString());
    assert.deepEqual(change.before, { mode: 'off', source: 'default', allowlistBusinessIds: [] });
    assert.equal(change.affected, 3);
    assert.deepEqual(store.events, [change.event]);
  });

  it('allowlist: keeps the listed tenants once each, and counts them', async () => {
    const { deps } = flagSetup();
    const change = await setPlatformFlag(deps, {
      key: 'merma',
      mode: 'allowlist',
      allowlist: [bid(2), bid(1), bid(2)],
      reason: 'Beta cerrada (N-30)',
    });
    assert.deepEqual(change.event.allowlistBusinessIds, [bid(1), bid(2)]);
    assert.equal(change.affected, 2);
  });

  it('turning a released key off for everyone needs the explicit confirmation', async () => {
    const { deps, store } = flagSetup();
    await rejectsWith(
      setPlatformFlag(deps, { key: 'stock', mode: 'off', reason: 'Incidente' }),
      'NEEDS_CONFIRMATION',
    );
    assert.equal(store.events.length, 0);
    const change = await setPlatformFlag(deps, {
      key: 'stock',
      mode: 'off',
      reason: 'Incidente',
      confirmacion: CONFIRM_OFF,
    });
    assert.equal(change.affected, 3);
    assert.equal(change.before.mode, 'on');
  });

  it('pinning a dark key off explicitly needs no confirmation', async () => {
    const { deps } = flagSetup();
    const change = await setPlatformFlag(deps, { key: 'asesorLlm', mode: 'off', reason: REASON });
    assert.equal(change.before.source, 'default');
  });

  it('refuses a change that changes nothing', async () => {
    const { deps } = flagSetup();
    await setPlatformFlag(deps, { key: 'merma', mode: 'on', reason: REASON });
    await rejectsWith(
      setPlatformFlag(deps, { key: 'merma', mode: 'on', reason: 'Otra vez' }),
      'NO_CHANGE',
    );
  });

  it('refuses an unknown key, a missing reason and a list outside allowlist mode', async () => {
    const { deps } = flagSetup();
    await rejectsWith(
      setPlatformFlag(deps, { key: 'teleport', mode: 'on', reason: REASON }),
      'VALIDATION',
    );
    await rejectsWith(
      setPlatformFlag(deps, { key: 'merma', mode: 'on', reason: ' ' }),
      'VALIDATION',
    );
    await rejectsWith(
      setPlatformFlag(deps, { key: 'merma', mode: 'on', allowlist: [bid(1)], reason: REASON }),
      'VALIDATION',
    );
    await rejectsWith(
      setPlatformFlag(deps, { key: 'merma', mode: 'allowlist', allowlist: [], reason: REASON }),
      'VALIDATION',
    );
  });

  it('refuses an allowlist naming a business that does not exist', async () => {
    const { deps, store } = flagSetup();
    await rejectsWith(
      setPlatformFlag(deps, {
        key: 'merma',
        mode: 'allowlist',
        allowlist: [bid(1), bid(9)],
        reason: REASON,
      }),
      'UNKNOWN_TENANT',
    );
    assert.equal(store.events.length, 0);
  });

  it('a store failure surfaces as STORE_FAILED', async () => {
    const broken = new InMemoryPlatformFlags();
    broken.append = () => Promise.reject(new Error('connection refused'));
    const { deps } = flagSetup(broken);
    await rejectsWith(
      setPlatformFlag(deps, { key: 'merma', mode: 'on', reason: REASON }),
      'STORE_FAILED',
    );
  });
});
