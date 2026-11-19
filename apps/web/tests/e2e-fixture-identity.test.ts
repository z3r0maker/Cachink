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

/**
 * The factory's home since S-02 (ADR-153 §4): `@xangarro/testing/tenant`,
 * which the portal's e2e and Synth both mint through.
 */
const FACTORY = path.resolve(import.meta.dirname, '../../../packages/testing/src/tenant');

/** The one module there that may insert a business: the factory itself. */
const OWNS_THE_ROWS = new Set(['mint.ts']);

type Source = { readonly name: string; readonly source: string };

function tsFiles(dir: string): readonly Source[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((name) => ({ name, source: readFileSync(path.join(dir, name), 'utf8') }));
}

const e2eFiles = (): readonly Source[] => tsFiles(E2E);
const factoryFiles = (): readonly Source[] => tsFiles(FACTORY);

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
    const inserts = ({ source }: Source) => /INSERT INTO businesses\b/.test(source);
    const offenders = [
      ...e2eFiles()
        .filter(inserts)
        .map(({ name }) => `e2e/${name}`),
      ...factoryFiles()
        .filter(({ name }) => !OWNS_THE_ROWS.has(name))
        .filter(inserts)
        .map(({ name }) => `testing/tenant/${name}`),
    ];
    assert.deepEqual(offenders, [], `mintTenant() from ./tenant in: ${offenders.join(', ')}`);
  });

  it('still finds the factory, so the rule above is not vacuous', () => {
    const factory = factoryFiles().find(({ name }) => OWNS_THE_ROWS.has(name));
    assert.ok(factory, `no ${[...OWNS_THE_ROWS].join(', ')} in ${FACTORY}`);
    assert.match(factory.source, /INSERT INTO businesses\b/);
    assert.match(factory.source, /export function stamp\(\)/);
  });
});
