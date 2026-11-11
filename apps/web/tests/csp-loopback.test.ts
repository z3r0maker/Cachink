import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

import { proxy } from '../src/proxy';

/**
 * `upgrade-insecure-requests` belongs to pages served over https. On a page
 * the server itself sent over plain http on this machine (the E2E suite's
 * `next start`), WebKit upgrades every script and stylesheet to an https
 * nobody serves, and the portal runs with no JavaScript at all: `/empleados`'s
 * redirect never happened in Safari once the policy was enforced. Chromium
 * exempts localhost from the upgrade, which is why only WebKit showed it.
 */
const policyFor = (url: string) =>
  proxy(new NextRequest(url)).headers.get('Content-Security-Policy') ?? '';

const UPGRADE = 'upgrade-insecure-requests';

describe('upgrade-insecure-requests', () => {
  // Development leaves the directive out on every host; this is the build's rule.
  beforeEach(() => vi.stubEnv('NODE_ENV', 'production'));
  afterEach(() => vi.unstubAllEnvs());

  it('is in the policy of a page served over https', () => {
    assert.ok(policyFor('https://app.xangarro.mx/ventas').includes(UPGRADE));
  });

  it('stays in the policy of a plain-http page on a real host', () => {
    assert.ok(policyFor('http://app.xangarro.mx/ventas').includes(UPGRADE));
  });

  it('is left out on plain http on this machine, by name or by address', () => {
    for (const url of [
      'http://localhost:3100/empleados',
      'http://127.0.0.1:3100/empleados',
      'http://[::1]:3100/empleados',
    ]) {
      assert.ok(!policyFor(url).includes(UPGRADE), url);
    }
  });

  it('stays on https localhost, and the rest of the policy never changes', () => {
    const local = policyFor('https://localhost:3100/ventas');
    assert.ok(local.includes(UPGRADE));
    const plain = policyFor('http://localhost:3100/ventas');
    const strip = (p: string) => p.replace(/'nonce-[^']+'/g, 'NONCE').replace(`${UPGRADE}; `, '');
    assert.equal(strip(plain), strip(local));
  });
});
