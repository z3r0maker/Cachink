import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { GEO_UNKNOWN_COUNTRY, regionFromHeaders } from '../src/server/geo/headers';

/** Only the two headers this feature is allowed to read. */
const geo = (country?: string, region?: string): Pick<Headers, 'get'> => ({
  get: (name: string) => {
    if (name === 'x-vercel-ip-country') return country ?? null;
    if (name === 'x-vercel-ip-country-region') return region ?? null;
    throw new Error(`the geo reader must not read ${name}`);
  },
});

describe('regionFromHeaders', () => {
  it('reads the country and the bare subdivision Vercel actually sends', () => {
    // Measured on a Hobby deployment 2026-09-22: 'MX' + 'CHH' (Chihuahua),
    // not the prefixed 'MX-CHH' the ISO code is usually written as.
    assert.deepEqual(regionFromHeaders(geo('MX', 'CHH')), { country: 'MX', region: 'CHH' });
  });

  it('keeps the country when the subdivision is missing', () => {
    // A VPN or a datacentre IP resolves to a country and no further.
    assert.deepEqual(regionFromHeaders(geo('MX')), { country: 'MX', region: '' });
  });

  it('falls back to the unknown country when no geo header arrives at all', () => {
    // Local dev, and any deployment whose plan does not enrich the request.
    assert.deepEqual(regionFromHeaders(geo()), { country: GEO_UNKNOWN_COUNTRY, region: '' });
  });

  it('normalises case and stray whitespace', () => {
    assert.deepEqual(regionFromHeaders(geo(' mx ', ' chh ')), { country: 'MX', region: 'CHH' });
  });

  it('drops a country-prefixed region rather than storing two formats', () => {
    // If Vercel ever switches to 'MX-CHH', the stored value must not become a
    // second spelling of the same place.
    assert.deepEqual(regionFromHeaders(geo('MX', 'MX-CHH')), { country: 'MX', region: 'CHH' });
  });

  it('rejects a country or region that is not the shape of a code', () => {
    assert.deepEqual(regionFromHeaders(geo('Mexico', 'Jalisco!')), {
      country: GEO_UNKNOWN_COUNTRY,
      region: '',
    });
    assert.deepEqual(regionFromHeaders(geo('MX', '')), { country: 'MX', region: '' });
  });

  it('never reads the client IP', () => {
    // The privacy claim the aviso rests on: this feature reads Vercel's
    // derived country and region, never x-forwarded-for. The fake throws on
    // any other header, so a stray read fails the suite loudly.
    assert.doesNotThrow(() => regionFromHeaders(geo('MX', 'CHH')));
  });
});
