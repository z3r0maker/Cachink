import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { LOGIN_ROLES } from '../scripts/hosted/roles';

/**
 * JIT per login role (audit DB2-PAGE-01). RLS hides a tenant's size from the
 * planner, so tenant queries carry inflated cost estimates and cross the JIT
 * threshold: measured +20–270 ms on the sync history. Request-serving roles run
 * short queries and turn it off; the nightly metering scans keep it.
 */
describe('LOGIN_ROLES jit', () => {
  const jitOf = (role: string) => LOGIN_ROLES.find((r) => r.role === role)?.jit;

  it('is off for every role that serves requests', () => {
    for (const role of ['xangarro_app', 'xangarro_billing', 'xangarro_admin']) {
      assert.equal(jitOf(role), false, role);
    }
  });

  it('stays on for the nightly metering scans', () => {
    assert.equal(jitOf('xangarro_metering'), true);
  });
});
