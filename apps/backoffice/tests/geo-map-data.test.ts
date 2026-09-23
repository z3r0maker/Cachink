import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { geoView } from '@/server/geo/list';
import { InMemoryGeoRollup, type DatedTally } from '@/server/geo/memory';
import { MX_STATE_CODES, MX_STATES, MX_VIEWBOX, stateName } from '@/server/geo/mx-states';

/**
 * The map geometry is a contract, not decoration (N-59).
 *
 * It is generated offline by a mapshaper pipeline recorded in `mx-states.ts`,
 * so the failure mode is not a crash: it is a state that quietly never paints,
 * or paints under a code nothing ever sends. Both are asserted here.
 */
describe('MX_STATES', () => {
  it('has all 32 federal entities, each with a name and an outline', () => {
    assert.equal(MX_STATE_CODES.length, 32);
    for (const code of MX_STATE_CODES) {
      assert.match(code, /^[A-Z]{3}$/, `${code} is not a bare ISO 3166-2 subdivision`);
      assert.ok(MX_STATES[code].nombre.length > 0, `${code} has no name`);
      assert.match(MX_STATES[code].d, /^M /, `${code} has no path data`);
      assert.match(MX_STATES[code].d, /Z$/, `${code}'s outline is not closed`);
    }
  });

  it('uses the current code for Mexico City, not the one retired in 2016', () => {
    // Natural Earth still ships MX-DIF; Vercel sends CMX. The pipeline remaps
    // it, and this is the assertion that catches a regenerated file that did
    // not — the symptom would be CDMX silently never painting.
    assert.ok(MX_STATE_CODES.includes('CMX'));
    assert.equal(MX_STATES.CMX.nombre, 'Ciudad de México');
    assert.ok(!(MX_STATE_CODES as readonly string[]).includes('DIF'));
  });

  it('carries no nameless placeholder feature', () => {
    // The source has MX-X01~, which the pipeline drops: 33 features in, 32 out.
    for (const code of MX_STATE_CODES) assert.doesNotMatch(code, /[^A-Z]/);
  });

  it('declares the extent its paths are drawn in', () => {
    assert.match(MX_VIEWBOX, /^0 0 \d+ \d+$/);
  });

  it('draws every state inside that extent, so none is clipped', () => {
    // A regenerated file with a different projection or fit would push a
    // coastal state off the edge, and the only symptom on screen would be a
    // state that looks oddly straight along one side.
    const [, , width, height] = MX_VIEWBOX.split(' ').map(Number) as [number, number, number, number];
    for (const code of MX_STATE_CODES) {
      const numbers = MX_STATES[code].d.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
      const xs = numbers.filter((_, i) => i % 2 === 0);
      const ys = numbers.filter((_, i) => i % 2 === 1);
      assert.ok(Math.min(...xs) >= 0 && Math.max(...xs) <= width, `${code} is off the map in x`);
      assert.ok(Math.min(...ys) >= 0 && Math.max(...ys) <= height, `${code} is off the map in y`);
    }
  });

  it('stays small enough to ship inside every render', () => {
    const bytes = MX_STATE_CODES.reduce((n, c) => n + MX_STATES[c].d.length, 0);
    assert.ok(bytes < 60_000, `path data is ${bytes} bytes; simplify harder`);
  });

  it('names an unknown code as itself rather than hiding it', () => {
    assert.equal(stateName('JAL'), 'Jalisco');
    assert.equal(stateName('ZZZ'), 'ZZZ');
  });
});

describe('the geometry and the rollup agree', () => {
  it('can paint every region the use case can produce', async () => {
    // The real coupling: a code the database returns must exist in the map, or
    // it ranks in the table and is invisible on the map beside it.
    const tallies: DatedTally[] = MX_STATE_CODES.map((code, i) => ({
      day: '2026-09-20',
      source: 'login',
      country: 'MX',
      region: code,
      hits: i + 1,
    }));
    const view = await geoView(
      { geo: new InMemoryGeoRollup(tallies) },
      { metrica: 'accesos' },
      new Date('2026-09-22T18:00:00.000Z'),
    );
    assert.equal(view.rows.length, 32);
    for (const row of view.rows) {
      assert.ok(
        (MX_STATE_CODES as readonly string[]).includes(row.code),
        `${row.code} ranks but cannot be painted`,
      );
      assert.notEqual(row.nombre, row.code, `${row.code} ranked without a name`);
    }
  });
});
