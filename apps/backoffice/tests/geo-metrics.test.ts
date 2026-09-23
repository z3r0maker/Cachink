import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { METRICS, bucketOf, valueOf } from '@/server/geo/metrics';
import type { GeoTally } from '@/server/geo/port';

/**
 * The metric registry is where a geographic dashboard either tells the truth
 * or quietly lies (N-56). Two failures are specifically guarded here:
 *
 * - a rate computed from a handful of visits (1 of 1 is not "100% conversion",
 *   it is noise, and on a map it is a bright lie), and
 * - a rate drawn on a sequential "darker is bigger" scale, which just redraws
 *   the population map instead of showing where a peso works hardest.
 */
const tally = (source: GeoTally['source'], region: string, hits: number): GeoTally => ({
  source,
  country: 'MX',
  region,
  hits,
});

describe('valueOf', () => {
  it('counts hits of the one source a count metric names', () => {
    const rows = [tally('login', 'JAL', 7), tally('landing', 'JAL', 99)];
    assert.equal(valueOf(METRICS.accesos, rows), 7);
    assert.equal(valueOf(METRICS.visitas, rows), 99);
  });

  it('divides checkouts by visits for the conversion rate', () => {
    const rows = [tally('landing', 'JAL', 200), tally('compra', 'JAL', 10)];
    assert.equal(valueOf(METRICS.conversion, rows), 0.05);
  });

  it('returns null, not zero, when a rate has too small a denominator', () => {
    // One visit and one checkout is not a 100% conversion rate.
    const rows = [tally('landing', 'BCS', 1), tally('compra', 'BCS', 1)];
    assert.equal(valueOf(METRICS.conversion, rows), null);
  });

  it('returns null for a rate with no denominator at all', () => {
    assert.equal(valueOf(METRICS.conversion, [tally('compra', 'JAL', 3)]), null);
  });

  it('counts zero as zero, which is a fact, unlike an unknown rate', () => {
    assert.equal(valueOf(METRICS.accesos, []), 0);
  });
});

describe('bucketOf', () => {
  it('shades a count against the period maximum', () => {
    const m = METRICS.accesos;
    assert.equal(bucketOf(m, 0, { max: 100, average: 0 }), 'cero');
    assert.equal(bucketOf(m, 10, { max: 100, average: 0 }), 'b1');
    assert.equal(bucketOf(m, 100, { max: 100, average: 0 }), 'b4');
  });

  it('never divides by a zero maximum', () => {
    assert.equal(bucketOf(METRICS.accesos, 0, { max: 0, average: 0 }), 'cero');
  });

  it('shades a rate against the national average, not the maximum', () => {
    // The actionable reading is "above or below average", so the same value
    // must land differently depending on how the country as a whole did.
    const m = METRICS.conversion;
    const scale = { max: 0.4, average: 0.1 };
    assert.equal(bucketOf(m, 0.2, scale), 'arriba');
    assert.equal(bucketOf(m, 0.05, scale), 'abajo');
    assert.equal(bucketOf(m, 0.1, scale), 'igual');
  });

  it('marks an unknown rate as insufficient, visibly not the same as zero', () => {
    assert.equal(bucketOf(METRICS.conversion, null, { max: 0.4, average: 0.1 }), 'insuficiente');
    assert.notEqual(
      bucketOf(METRICS.conversion, null, { max: 0.4, average: 0.1 }),
      bucketOf(METRICS.accesos, 0, { max: 10, average: 0 }),
    );
  });
});

describe('the registry itself', () => {
  it('says plainly that a checkout is not yet a payment', () => {
    // A metric called "conversión" that silently means something else is how
    // a dashboard causes a bad decision.
    assert.match(METRICS.conversion.help, /checkout/i);
  });

  it('gives every metric a label and a scale kind', () => {
    for (const metric of Object.values(METRICS)) {
      assert.ok(metric.label.length > 0);
      assert.ok(metric.kind === 'conteo' || metric.kind === 'tasa');
    }
  });
});
