import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  openingBalanceLocked,
  OpeningBalanceClientSchema,
  OpeningBalanceSchema,
} from '../../src/entities/opening-balance.js';

const AUDIT = {
  deviceId: '01HZ8XQN9GZJXV8AKQ5X0DEV01',
  createdByUserId: null,
  createdAt: '2026-09-18T12:00:00.000Z',
  updatedAt: '2026-09-18T12:00:00.000Z',
  deletedAt: null,
};

describe('OpeningBalance (C-20)', () => {
  it('parses a full row and reports it unlocked while lockedAt is null', () => {
    const ob = OpeningBalanceSchema.parse({
      id: '01HZ8XQN9GZJXV8AKQ5X00B001',
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7AAA',
      fechaApertura: '2026-09-01',
      cajaCentavos: 150_000n,
      bancosCentavos: 2_000_000n,
      lockedAt: null,
      ...AUDIT,
    });
    assert.equal(openingBalanceLocked(ob), false);
    assert.equal(ob.cajaCentavos + ob.bancosCentavos, 2_150_000n);
  });

  it('lockedAt makes it read-only', () => {
    const ob = OpeningBalanceSchema.parse({
      id: '01HZ8XQN9GZJXV8AKQ5X00B001',
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7AAA',
      fechaApertura: '2026-09-01',
      cajaCentavos: 0n,
      bancosCentavos: 0n,
      lockedAt: '2026-10-01T09:00:00.000Z',
      ...AUDIT,
    });
    assert.equal(openingBalanceLocked(ob), true);
  });

  it('refuses a malformed fecha and a negative caja', () => {
    const base = {
      id: '01HZ8XQN9GZJXV8AKQ5X00B001',
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7AAA',
      cajaCentavos: 0n,
      bancosCentavos: 0n,
      lockedAt: null,
      ...AUDIT,
    };
    assert.equal(
      OpeningBalanceSchema.safeParse({ ...base, fechaApertura: '2026-9-1' }).success,
      false,
    );
    assert.equal(
      OpeningBalanceSchema.safeParse({ ...base, fechaApertura: '2026-09-01', cajaCentavos: -1n })
        .success,
      false,
    );
  });

  it('a client line carries its saldo, negative allowed (a favor is refused upstream)', () => {
    const line = OpeningBalanceClientSchema.parse({
      id: '01HZ8XQN9GZJXV8AKQ5X0BC001',
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7AAA',
      clienteId: '01HZ8XQN9GZJXV8AKQ5X0C1001',
      saldoCentavos: -500n,
      ...AUDIT,
    });
    assert.equal(line.saldoCentavos, -500n);
  });
});
