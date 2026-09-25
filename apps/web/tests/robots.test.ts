import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import robots, { PUBLIC_PATHS } from '../src/app/robots';

/**
 * app.xangarro.mx is an application: a crawler that follows every link only
 * collects redirects to /login. The two public entry points stay indexable,
 * everything else is off limits, and there is no sitemap to point at.
 */
describe('portal robots.txt', () => {
  const rules = [robots().rules].flat();

  it('applies one rule to every crawler', () => {
    assert.equal(rules.length, 1);
    assert.equal(rules[0]?.userAgent, '*');
  });

  it('allows exactly the public entry points', () => {
    assert.deepEqual(rules[0]?.allow, ['/login', '/signup']);
    assert.deepEqual([...PUBLIC_PATHS], rules[0]?.allow);
  });

  it('disallows the rest of the portal', () => {
    assert.equal(rules[0]?.disallow, '/');
  });

  it('names no sitemap or host', () => {
    const out = robots();
    assert.equal(out.sitemap, undefined);
    assert.equal(out.host, undefined);
  });
});
