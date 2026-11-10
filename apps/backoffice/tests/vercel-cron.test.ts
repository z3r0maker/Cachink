import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

describe('vercel.json', () => {
  it("schedules the digest and the founders' agenda at 08:00 in Mexico City, the cobros before", () => {
    const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
      crons?: { path: string; schedule: string }[];
    };
    assert.deepEqual(config.crons, [
      { path: '/api/cron/digest', schedule: '0 14 * * *' },
      { path: '/api/cron/agenda', schedule: '0 14 * * *' },
      // E-10: yesterday's Stripe payments are in Movimientos before the founders open it.
      { path: '/api/cron/empresa-cobros', schedule: '0 12 * * *' },
    ]);
    const cdmxHour = (utc: string) =>
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Mexico_City',
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(new Date(utc));
    assert.equal(cdmxHour('2026-09-17T14:00:00.000Z'), '08');
    assert.equal(cdmxHour('2026-09-17T12:00:00.000Z'), '06');
  });
});
