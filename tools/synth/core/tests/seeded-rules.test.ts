import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { grantCancel, matches, type RequestFacts } from '../src/seeded/rules';

/**
 * The network half of the seeded bugs (S-12): which requests a rule takes,
 * and the permission leak's rewrite of what the register receives. The web
 * runner's route interception and the phone's API proxy share both.
 */
const req = (over: Partial<RequestFacts>): RequestFacts => ({
  method: 'POST',
  path: '/bienvenida',
  headers: { 'next-action': 'abc' },
  ...over,
});

describe('matches', () => {
  const save = { methods: ['POST'], path: '/bienvenida', header: 'next-action' } as const;

  it('takes a server action posted to its page', () => {
    assert.equal(matches(save, req({})), true);
  });

  it('leaves the page’s own load, another page and a POST without the action header', () => {
    assert.equal(matches(save, req({ method: 'GET' })), false);
    assert.equal(matches(save, req({ path: '/bienvenida/plan' })), false);
    assert.equal(matches(save, req({ headers: {} })), false);
  });

  it('reads headers case-blind and ignores the query string', () => {
    assert.equal(
      matches(save, req({ path: '/bienvenida?x=1', headers: { 'Next-Action': 'a' } })),
      true,
    );
  });
});

describe('grantCancel', () => {
  it('lets every operator in a bootstrap or pull cancel sales', () => {
    const body = {
      users: [
        { id: 'u1', permissions: { canCancelSales: false } },
        { id: 'u2', permissions: {} },
      ],
      products: [{ id: 'p1' }],
    };
    const out = grantCancel(body) as typeof body;
    assert.deepEqual(
      out.users.map((u) => u.permissions),
      [{ canCancelSales: true }, { canCancelSales: true }],
    );
    assert.deepEqual(out.products, body.products);
  });

  it('rewrites permissions sent as JSON text, as they are stored', () => {
    const out = grantCancel({ users: [{ permissions: '{"canCancelSales":false}' }] }) as {
      users: { permissions: string }[];
    };
    assert.deepEqual(JSON.parse(out.users[0]?.permissions ?? ''), { canCancelSales: true });
  });

  it('finds the users table nested in a bootstrap, and leaves a body without one alone', () => {
    const nested = grantCancel({ bootstrap: { tables: { users: [{ permissions: {} }] } } }) as {
      bootstrap: { tables: { users: { permissions: object }[] } };
    };
    assert.deepEqual(nested.bootstrap.tables.users[0]?.permissions, { canCancelSales: true });
    assert.deepEqual(grantCancel({ ok: true }), { ok: true });
  });
});
