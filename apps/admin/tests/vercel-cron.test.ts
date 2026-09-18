import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

describe('vercel.json', () => {
  it('schedules the digest at 14:00 UTC, which is 08:00 in Mexico City', () => {
    const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
      crons?: { path: string; schedule: string }[];
    };
    assert.deepEqual(config.crons, [{ path: '/api/cron/digest', schedule: '0 14 * * *' }]);
    const cdmxHour = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Mexico_City',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date('2026-09-17T14:00:00.000Z'));
    assert.equal(cdmxHour, '08');
  });
});
