import { describe, expect, it } from 'vitest';

import { estampa } from '../src/queries/comprobante.js';

describe('estampa — a ticket’s day and time as one parseable stamp', () => {
  it('pads an hour written without its leading zero', () => {
    expect(estampa('2026-09-26', '9:02')).toBe('2026-09-26T09:02:00-06:00');
  });

  it('drops seconds and a time glued onto the day', () => {
    expect(estampa('2026-09-26T03:10:00Z', '14:32:05')).toBe('2026-09-26T14:32:00-06:00');
  });

  it('uses noon when the ticket has no time', () => {
    expect(estampa('2026-09-26', null)).toBe('2026-09-26T12:00:00-06:00');
  });

  it('always parses', () => {
    for (const hora of ['9:02', '09:02', '14:32:05', null]) {
      expect(Number.isNaN(Date.parse(estampa('2026-09-26', hora)))).toBe(false);
    }
  });
});
