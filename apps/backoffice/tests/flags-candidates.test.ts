import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { FlagError } from '@/server/flags/errors';
import { allowlistCandidates } from '@/server/flags/candidates';

import { bid, directory, failing, tenant } from './support/tenants';

const dir = () => directory(tenant(1), tenant(2), tenant(3, { nombre: 'Tacos Lupita' }));

describe('allowlistCandidates', () => {
  it('lists the current members checked, then search hits not yet listed', async () => {
    const c = await allowlistCandidates(dir(), [bid(1)], 'negocio');
    assert.deepEqual(
      c.map((x) => [x.id, x.listed]),
      [
        [bid(1), true],
        [bid(2), false],
      ],
    );
  });

  it('with no search, shows only the members', async () => {
    const c = await allowlistCandidates(dir(), [bid(3)], null);
    assert.deepEqual(
      c.map((x) => x.nombre),
      ['Tacos Lupita'],
    );
  });

  it('a member the directory no longer knows still shows, so it can be removed', async () => {
    const c = await allowlistCandidates(dir(), [bid(9)], null);
    assert.deepEqual(c, [{ id: bid(9), nombre: bid(9), ownerEmail: null, listed: true }]);
  });

  it('a directory failure surfaces as STORE_FAILED', async () => {
    await assert.rejects(
      allowlistCandidates(failing.directory(), [], 'x'),
      (e: unknown) => e instanceof FlagError && e.code === 'STORE_FAILED',
    );
  });
});
