import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { conTotales, vigentes } from '../../src/index.js';

/**
 * Ticket + lines → the projections the calculators take (ADR-073): a ticket's
 * total is derived, never stored, and only tickets that still stand count —
 * a cancellation refunds every line.
 */

const T1 = '01HZ8XQN9GZJXV8AKQ5X0C7AA1';
const T2 = '01HZ8XQN9GZJXV8AKQ5X0C7AA2';

const ticket = (id: string, over: Record<string, unknown> = {}) =>
  ({
    id,
    fecha: '2026-05-12',
    metodo: 'Efectivo',
    estadoPago: 'pagado',
    cancelledAt: null,
    deletedAt: null,
    ...over,
  }) as never;

const linea = (ticketId: string, monto: bigint, over: Record<string, unknown> = {}) =>
  ({ ticketId, monto, deletedAt: null, ...over }) as never;

describe('conTotales', () => {
  it('a ticket total is the sum of its live lines', () => {
    const ts = conTotales([ticket(T1)], [linea(T1, 120_00n), linea(T1, 80_00n)]);
    assert.equal(ts[0]?.total, 200_00n);
  });

  it('a deleted line does not count toward the total', () => {
    const ts = conTotales(
      [ticket(T1)],
      [linea(T1, 120_00n), linea(T1, 80_00n, { deletedAt: '2026-05-13T00:00:00Z' })],
    );
    assert.equal(ts[0]?.total, 120_00n);
  });

  it('a ticket with no lines totals zero, not undefined', () => {
    const ts = conTotales([ticket(T1)], []);
    assert.equal(ts[0]?.total, 0n);
  });

  it('lines of one ticket never leak into another', () => {
    const ts = conTotales([ticket(T1), ticket(T2)], [linea(T2, 50_00n)]);
    assert.equal(ts[0]?.total, 0n);
    assert.equal(ts[1]?.total, 50_00n);
  });
});

describe('vigentes', () => {
  it('only tickets that still stand — no cancelled, no deleted', () => {
    const vivos = vigentes([
      ticket(T1),
      ticket(T2, { cancelledAt: '2026-05-12T20:00:00Z' }),
      ticket(T1, { deletedAt: '2026-05-12T21:00:00Z' }),
    ]);
    assert.equal(vivos.length, 1);
    assert.equal(vivos[0]?.id, T1);
  });
});
