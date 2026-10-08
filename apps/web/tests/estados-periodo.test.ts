import assert from 'node:assert/strict';
import { describe, it, vi } from 'vitest';
import type { IsoDate } from '@xangarro/domain';

import { periodoDe } from '../src/app/(portal)/estados/periodo';
import { leerEstado, urlDe } from '../src/app/(portal)/movimientos/url';

/**
 * The portal's period parsing (DB3-EST-01, R3-14): Estados' custom range is
 * capped at 13 months on the server, and a day that does not exist is not a
 * date anywhere a URL carries one.
 */
const withTenant = vi.fn();
vi.mock('../src/server/db', () => ({ withTenant }));
const { leerPeriodo, RangoExcedidoError } = await import('../src/server/estados-lectura');

const HOY = '2026-05-12' as IsoDate;
const custom = (desde: string, hasta: string) =>
  periodoDe(HOY, { p: 'personalizado', desde, hasta });

describe('periodoDe — Personalizado', () => {
  it('computes a range of up to 13 months as asked', () => {
    const p = custom('2025-05-01', '2026-05-31');
    assert.deepEqual(p.rango, { desde: '2025-05-01', hasta: '2026-05-31' });
    assert.equal(p.excedido, false);
  });

  it('keeps a longer range to show it, but marks it refused', () => {
    const p = custom('2000-01-01', '2099-12-31');
    assert.equal(p.tipo, 'personalizado');
    assert.deepEqual(p.rango, { desde: '2000-01-01', hasta: '2099-12-31' });
    assert.equal(p.excedido, true);
    assert.equal(custom('2025-05-01', '2026-06-01').excedido, true, 'one day past 13 months');
  });

  it('falls back to the month for a day that does not exist', () => {
    const p = custom('2026-02-30', '2026-03-31');
    assert.deepEqual(p.rango, { desde: '2026-05-01', hasta: '2026-05-31' });
    assert.equal(p.excedido, false);
  });

  it('falls back to the month for a backwards or malformed range', () => {
    for (const [d, h] of [
      ['2026-05-31', '2026-05-01'],
      ['2026-5-1', '2026-05-31'],
      ['', ''],
    ] as const) {
      assert.deepEqual(custom(d, h).rango, { desde: '2026-05-01', hasta: '2026-05-31' }, d);
    }
  });

  it('never marks the fixed periods, whatever the URL carries', () => {
    const p = periodoDe(HOY, { p: 'anual', desde: '2000-01-01', hasta: '2099-12-31' });
    assert.deepEqual(p.rango, { desde: '2026-01-01', hasta: '2026-12-31' });
    assert.equal(p.excedido, false);
  });
});

describe('leerPeriodo — the server-side cap', () => {
  it('refuses a range past 13 months without opening a transaction', async () => {
    await assert.rejects(
      leerPeriodo('biz-1', '2000-01-01', '2099-12-31'),
      (e: unknown) => e instanceof RangoExcedidoError && e.code === 'RANGO_EXCEDIDO',
    );
    await assert.rejects(leerPeriodo('biz-1', '2026-05-31', '2026-05-01'), RangoExcedidoError);
    assert.equal(withTenant.mock.calls.length, 0);
  });
});

describe('Movimientos URL dates', () => {
  it('drops a day that does not exist instead of letting it reach SQL', () => {
    const e = leerEstado({ rango: 'personalizado', desde: '2026-02-30', hasta: '2026-04-31' });
    assert.equal(e.desde, '');
    assert.equal(e.hasta, '');
    const ok = leerEstado({ rango: 'personalizado', desde: '2026-02-28', hasta: '2026-04-30' });
    assert.deepEqual([ok.desde, ok.hasta], ['2026-02-28', '2026-04-30']);
  });

  it('reads «Ir a fecha» only as a real day, and never writes it back (DS-01)', () => {
    assert.equal(leerEstado({ ir: '2026-05-03' }).ir, '2026-05-03');
    for (const ir of ['2026-02-30', '03/05/2026', '', undefined]) {
      assert.equal(leerEstado({ ir }).ir, '', String(ir));
    }
    const e = leerEstado({ ir: '2026-05-03', pagina: '4', q: 'pan' });
    assert.equal(urlDe({ ...e, ir: '' }), '/movimientos?q=pan&pagina=4');
    assert.doesNotMatch(urlDe(e), /ir=/, 'the day is resolved server-side, not kept in links');
  });
});
