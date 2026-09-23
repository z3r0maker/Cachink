import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { geoView } from '@/server/geo/list';
import { failingGeoRollup, InMemoryGeoRollup, type DatedTally } from '@/server/geo/memory';
import { TenantError } from '@/server/tenants/errors';

const NOW = new Date('2026-09-22T18:00:00.000Z');

const at = (
  day: string,
  source: DatedTally['source'],
  region: string,
  hits: number,
  country = 'MX',
): DatedTally => ({ day, source, country, region, hits });

const deps = (tallies: readonly DatedTally[]) => ({ geo: new InMemoryGeoRollup(tallies) });

describe('geoView', () => {
  it('ranks states by the chosen metric, naming each one', async () => {
    const view = await geoView(
      deps([at('2026-09-20', 'login', 'JAL', 34), at('2026-09-21', 'login', 'CMX', 28)]),
      { metrica: 'accesos' },
      NOW,
    );
    assert.deepEqual(
      view.rows.map((r) => [r.nombre, r.value]),
      [
        ['Jalisco', 34],
        ['Ciudad de México', 28],
      ],
    );
    assert.equal(view.national, 62);
  });

  it('keeps an unresolved region out of the ranking but visible in the total', async () => {
    // A VPN or a datacentre IP resolves to a country and no further. Hiding
    // those hits would quietly overstate every state that did resolve.
    const view = await geoView(
      deps([at('2026-09-20', 'login', 'JAL', 10), at('2026-09-20', 'login', '', 4)]),
      { metrica: 'accesos' },
      NOW,
    );
    assert.deepEqual(view.rows.map((r) => r.code), ['JAL']);
    assert.equal(view.sinEstado, 4);
    assert.equal(view.national, 14);
  });

  it('separates traffic from outside Mexico rather than mapping it', async () => {
    const view = await geoView(
      deps([at('2026-09-20', 'login', 'JAL', 10), at('2026-09-20', 'login', 'TX', 6, 'US')]),
      { metrica: 'accesos' },
      NOW,
    );
    assert.deepEqual(view.rows.map((r) => r.code), ['JAL']);
    assert.equal(view.fueraDeMexico, 6);
    // The national figure is Mexico's, so a foreign hit must not inflate it.
    assert.equal(view.national, 10);
  });

  it('hides a conversion rate built on too few visits, and says why', async () => {
    const view = await geoView(
      deps([
        at('2026-09-20', 'landing', 'BCS', 1),
        at('2026-09-20', 'compra', 'BCS', 1),
        at('2026-09-20', 'landing', 'JAL', 200),
        at('2026-09-20', 'compra', 'JAL', 20),
      ]),
      { metrica: 'conversion' },
      NOW,
    );
    const bcs = view.rows.find((r) => r.code === 'BCS');
    const jal = view.rows.find((r) => r.code === 'JAL');
    assert.equal(bcs?.value, null, 'one visit is not a 100% conversion rate');
    assert.equal(bcs?.bucket, 'insuficiente');
    assert.equal(jal?.value, 0.1);
  });

  it('shades a rate against the national average, so above and below differ', async () => {
    const view = await geoView(
      deps([
        at('2026-09-20', 'landing', 'JAL', 100),
        at('2026-09-20', 'compra', 'JAL', 20), // 20%
        at('2026-09-20', 'landing', 'CMX', 100),
        at('2026-09-20', 'compra', 'CMX', 2), // 2%, national is 11%
      ]),
      { metrica: 'conversion' },
      NOW,
    );
    assert.equal(view.rows.find((r) => r.code === 'JAL')?.bucket, 'arriba');
    assert.equal(view.rows.find((r) => r.code === 'CMX')?.bucket, 'abajo');
  });

  it('ignores days outside the range', async () => {
    const view = await geoView(
      deps([at('2025-01-01', 'login', 'JAL', 999), at('2026-09-20', 'login', 'JAL', 3)]),
      { rango: '30d', metrica: 'accesos' },
      NOW,
    );
    assert.equal(view.national, 3);
  });

  it('returns an empty view rather than failing when nothing was recorded', async () => {
    const view = await geoView(deps([]), { metrica: 'accesos' }, NOW);
    assert.deepEqual(view.rows, []);
    assert.equal(view.national, 0);
  });

  it('refuses an unknown metric instead of silently defaulting', async () => {
    await assert.rejects(
      () => geoView(deps([]), { metrica: 'lo-que-sea' }, NOW),
      (e: unknown) => e instanceof TenantError && e.code === 'VALIDATION',
    );
  });

  it('turns a database failure into STORE_FAILED', async () => {
    await assert.rejects(
      () => geoView({ geo: failingGeoRollup }, { metrica: 'accesos' }, NOW),
      (e: unknown) => e instanceof TenantError && e.code === 'STORE_FAILED',
    );
  });
});
