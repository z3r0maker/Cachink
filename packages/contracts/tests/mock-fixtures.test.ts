import { afterEach, describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';

import { mismoCodigo } from '@xangarro/domain';
import { buildFixtures, MOCK_BARCODES } from '../src/mock/fixtures.js';

/**
 * The seeded «Renta local» is due on the current month's 1st, so a run on
 * any day finds exactly one payment due: paying it moves the schedule past
 * today (gastos-pagar-recurrente.yaml). A fixed date went two months behind
 * as the calendar moved, and one payment then left the next month showing.
 */

const renta = () => buildFixtures().recurring_expenses[0] as { proximoDisparo: string };

/** Local noon, so the host's time zone never shifts the day. */
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);

afterEach(() => {
  vi.useRealTimers();
});

describe('mock fixtures · the due recurrente follows the calendar', () => {
  it('mid-month: due on this month’s 1st', () => {
    vi.useFakeTimers({ now: at(2026, 11, 19) });
    assert.equal(renta().proximoDisparo, '2026-11-01');
  });

  it('on the 1st itself: due today, not next month', () => {
    vi.useFakeTimers({ now: at(2027, 3, 1) });
    assert.equal(renta().proximoDisparo, '2027-03-01');
  });

  it('on the last day of December: still this month, not the new year', () => {
    vi.useFakeTimers({ now: new Date(2026, 11, 31, 23, 30) });
    assert.equal(renta().proximoDisparo, '2026-12-01');
  });
});

/**
 * The escáner flows read these codes (M-19, ADR-150): one product with its
 * own barcode, two that share one in its EAN-13 and UPC-A forms, and the
 * rest with a plain code the catalogue search still finds.
 */
describe('mock fixtures · the barcodes the escáner reads', () => {
  const products = () => buildFixtures().products;
  const conCodigo = (codigo: string) =>
    products()
      .filter((p) => mismoCodigo(p.sku, codigo))
      .map((p) => p.nombre);

  it('gives Refresco a barcode of its own', () => {
    assert.deepEqual(conCodigo(MOCK_BARCODES['Refresco 600ml']), ['Refresco 600ml']);
  });

  it('gives Agua de jamaica and Cerveza one code in two forms', () => {
    assert.deepEqual(conCodigo('012345000065'), ['Agua de jamaica', 'Cerveza']);
    assert.notEqual(MOCK_BARCODES.Cerveza, MOCK_BARCODES['Agua de jamaica']);
  });

  it('keeps a plain code on every other product, none of them shared', () => {
    const otros = products().filter((p) => !(p.nombre in MOCK_BARCODES));
    assert.ok(otros.every((p) => p.sku?.startsWith('SKU-')));
    assert.equal(new Set(otros.map((p) => p.sku)).size, otros.length);
  });
});
