import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, it } from 'vitest';

/**
 * ADR-103's ownership half, held mechanically.
 *
 * A spec that writes owns its data: it mints a business from `e2e/tenant.ts`
 * and writes only there. Two rules keep that true, and both were learned from
 * CI rather than from first principles:
 *
 *   1. **No clock in an identity.** `Date.now()` inside a string was always an
 *      identity — an email, a business name, a payload meant to be unique — and
 *      the millisecond is shared by however many workers start together, which
 *      is how `duplicate key value violates unique constraint "users_email_key"`
 *      kept coming back, patched one spec at a time. `stamp()` is the
 *      replacement and carries the pid plus a UUID. Arithmetic on the clock
 *      (`new Date(Date.now() + 3_600_000)`) is a real use and stays.
 *   2. **Only the factory inserts a business.** Seventeen specs each built the
 *      same four rows their own way; whoever writes the eighteenth gets the
 *      factory instead, which is also the only place that knows how a tenant's
 *      plan reaches the billing database.
 */
const E2E = path.resolve(import.meta.dirname, '../e2e');

/** The factory itself, and the module that teaches the rule. */
const OWNS_THE_ROWS = new Set(['tenant.ts', 'tenant-rows.ts']);

function e2eFiles(): readonly { readonly name: string; readonly source: string }[] {
  return readdirSync(E2E)
    .filter((f) => f.endsWith('.ts'))
    .map((name) => ({ name, source: readFileSync(path.join(E2E, name), 'utf8') }));
}

describe('E2E fixtures own their data (ADR-103)', () => {
  it('no spec builds an identity from the clock', () => {
    // Inside a `${…}`, so the clock's own arithmetic is left alone.
    const identity = /\$\{[^}]*Date\.now\(\)/;
    const offenders = e2eFiles()
      .filter(({ name }) => name.endsWith('.spec.ts'))
      .filter(({ source }) => identity.test(source))
      .map(({ name }) => name);
    assert.deepEqual(offenders, [], `use stamp() from ./tenant in: ${offenders.join(', ')}`);
  });

  it('the rules catch what they guard against', () => {
    const identity = /\$\{[^}]*Date\.now\(\)/;
    assert.equal(identity.test('const email = `a-${Date.now()}@test.mx`;'), true);
    assert.equal(identity.test('new Date(Date.now() + 3_600_000).toISOString()'), false);
  });

  it('only the tenant factory inserts a business', () => {
    const offenders = e2eFiles()
      .filter(({ name }) => !OWNS_THE_ROWS.has(name))
      .filter(({ source }) => /INSERT INTO businesses\b/.test(source))
      .map(({ name }) => name);
    assert.deepEqual(offenders, [], `mintTenant() from ./tenant in: ${offenders.join(', ')}`);
  });
});
