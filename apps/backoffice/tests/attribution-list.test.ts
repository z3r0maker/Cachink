import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { attributionView, DIRECT } from '@/server/attribution/list';
import { failingAttribution, InMemoryAttribution } from '@/server/attribution/memory';
import type { AttributionTally } from '@/server/attribution/port';
import { TenantError } from '@/server/tenants/errors';

const NOW = new Date('2026-09-22T18:00:00.000Z');

const t = (
  campaign: string,
  region: string,
  signups: number,
  source = 'facebook',
  medium = 'cpc',
): AttributionTally => ({ source, medium, campaign, region, signups });

const deps = (rows: readonly AttributionTally[]) => ({
  attribution: new InMemoryAttribution(rows),
});

describe('attributionView', () => {
  it('ranks campaigns by signups', async () => {
    const view = await attributionView(
      deps([t('taquerias-gdl', 'JAL', 12), t('abarrotes-mty', 'NLE', 30)]),
      '30d',
      NOW,
    );
    assert.deepEqual(
      view.rows.map((r) => [r.campaign, r.signups]),
      [
        ['abarrotes-mty', 30],
        ['taquerias-gdl', 12],
      ],
    );
    assert.equal(view.total, 42);
  });

  it('sums a campaign across the states it came from, and names the biggest', async () => {
    const view = await attributionView(
      deps([t('taquerias-gdl', 'JAL', 9), t('taquerias-gdl', 'CMX', 4)]),
      '30d',
      NOW,
    );
    assert.equal(view.rows.length, 1);
    assert.equal(view.rows[0]?.signups, 13);
    assert.equal(view.rows[0]?.topRegion, 'Jalisco');
  });

  it('treats traffic with no labels as a real row, not a gap', async () => {
    // "How many arrive with no campaign at all" is usually the largest and
    // most useful number here, so it must not be silently dropped.
    const view = await attributionView(deps([t('', 'JAL', 25, '', '')]), '30d', NOW);
    assert.equal(view.rows[0]?.campaign, DIRECT);
    assert.equal(view.rows[0]?.direct, true);
    assert.equal(view.directTotal, 25);
  });

  it('keeps a campaign whose state was never resolved', async () => {
    // Dropping it would make the campaign look like it produced nothing.
    const view = await attributionView(deps([t('newsletter', '', 5)]), '30d', NOW);
    assert.equal(view.rows[0]?.signups, 5);
    assert.equal(view.rows[0]?.topRegion, 'Sin estado');
  });

  it('separates two campaigns that share a name but not a source', async () => {
    const view = await attributionView(
      deps([
        t('verano', 'JAL', 3, 'facebook', 'cpc'),
        t('verano', 'JAL', 8, 'instagram', 'organic'),
      ]),
      '30d',
      NOW,
    );
    assert.equal(view.rows.length, 2);
    assert.equal(view.total, 11);
  });

  it('returns an empty view rather than failing when nothing was recorded', async () => {
    const view = await attributionView(deps([]), '30d', NOW);
    assert.deepEqual(view.rows, []);
    assert.equal(view.total, 0);
  });

  it('turns a database failure into STORE_FAILED', async () => {
    await assert.rejects(
      () => attributionView({ attribution: failingAttribution }, '30d', NOW),
      (e: unknown) => e instanceof TenantError && e.code === 'STORE_FAILED',
    );
  });
});
