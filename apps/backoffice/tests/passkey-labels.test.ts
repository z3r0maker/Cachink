import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { passkeyDates } from '@/server/auth/passkey-labels';

const NOW = new Date('2026-11-20T21:00:00Z'); // 15:00 in Mexico City

describe('passkeyDates', () => {
  it('says «hoy» for a use earlier today in Mexico City', () => {
    const text = passkeyDates(
      new Date('2026-11-20T15:12:00Z'),
      new Date('2026-11-20T15:12:00Z'),
      NOW,
    );
    assert.match(text, /^Creada el 20 nov · último uso hoy a las 9:12/);
  });

  it('names the day of an older use, by Mexico City’s calendar', () => {
    // 02:00 UTC on the 18th is still the 17th in Mexico City.
    const text = passkeyDates(
      new Date('2026-11-01T18:00:00Z'),
      new Date('2026-11-18T02:00:00Z'),
      NOW,
    );
    assert.match(text, /^Creada el 1 nov · último uso el 17 nov a las 20:00/);
  });

  it('says so when a passkey was never used', () => {
    assert.equal(
      passkeyDates(new Date('2026-11-20T15:00:00Z'), null, NOW),
      'Creada el 20 nov · todavía sin usar',
    );
  });
});
