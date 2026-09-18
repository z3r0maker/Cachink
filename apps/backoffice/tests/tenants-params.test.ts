import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { parseTenantView, tenantsHref, toTenantListInput } from '@/app/(consola)/tenants/params';

describe('tenant list URL state', () => {
  it('reads search, plan, status and the stale filter from the query string', () => {
    const view = parseTenantView({
      q: ' tacos ',
      plan: 'xangarro',
      estado: 'past_due',
      sin_sync: '1',
    });
    assert.deepEqual(toTenantListInput(view, 'c1'), {
      q: 'tacos',
      plan: 'xangarro',
      status: 'past_due',
      stale: true,
      cursor: 'c1',
    });
  });

  it('ignores unknown values instead of failing', () => {
    const view = parseTenantView({ plan: 'oro', estado: ['cancelado'], sin_sync: 'si', q: '' });
    assert.deepEqual(toTenantListInput(view, null), {});
  });

  it('builds a shareable href and always resets the page', () => {
    const view = parseTenantView({ q: 'a&b', plan: 'xangarrote' });
    assert.equal(tenantsHref(view), '/tenants?q=a%26b&plan=xangarrote');
    assert.equal(tenantsHref(view, { plan: null }, 'c2'), '/tenants?q=a%26b&cursor=c2');
    assert.equal(tenantsHref(parseTenantView({})), '/tenants');
  });
});
