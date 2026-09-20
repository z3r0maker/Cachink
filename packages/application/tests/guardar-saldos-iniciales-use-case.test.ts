import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import {
  BloquearSaldosInicialesUseCase,
  GuardarSaldosInicialesUseCase,
  type OpeningBalancesPort,
} from '../src/index.js';

/** In-memory port: one header + lines per business, with the one-way lock. */
function port(): OpeningBalancesPort & { saved: unknown[]; locked: string[] } {
  const state = new Map<string, { locked: boolean }>();
  const saved: unknown[] = [];
  const locked: string[] = [];
  return {
    saved,
    locked,
    of: async (id) =>
      (state.has(id) ? { lockedAt: state.get(id)?.locked ? '2026-10-01' : null } : null) as never,
    save: async (input) => {
      saved.push(input);
      state.set(input.businessId, { locked: false });
    },
    lock: async (id) => {
      if (!state.has(id) || state.get(id)?.locked) return false;
      state.set(id, { locked: true });
      locked.push(id);
      return true;
    },
  };
}

const BASE = {
  businessId: 'B1',
  fechaApertura: '2026-09-01',
  cajaCentavos: 100n,
  bancosCentavos: 200n,
  lines: [{ clienteId: 'C1', saldoCentavos: 50n }],
};

describe('GuardarSaldosInicialesUseCase', () => {
  let p: ReturnType<typeof port>;

  beforeEach(() => {
    p = port();
  });

  it('saves the day-one facts through the port', async () => {
    await new GuardarSaldosInicialesUseCase(p).execute(BASE);
    assert.equal(p.saved.length, 1);
    assert.deepEqual(p.saved[0], BASE);
  });

  it('refuses once the owner locked the rows', async () => {
    await new GuardarSaldosInicialesUseCase(p).execute(BASE);
    await new BloquearSaldosInicialesUseCase(p).execute({ businessId: 'B1' });
    await assert.rejects(
      new GuardarSaldosInicialesUseCase(p).execute({ ...BASE, cajaCentavos: 1n }),
      (e: unknown) => (e as { code?: string }).code === 'SALDOS_BLOQUEADOS',
    );
    assert.equal(p.saved.length, 1, 'the second save never reached the port');
  });

  it('refuses a malformed fecha, negative caja and a duplicated cliente', async () => {
    await assert.rejects(
      new GuardarSaldosInicialesUseCase(p).execute({
        ...BASE,
        fechaApertura: '2026-9-1',
        cajaCentavos: -1n,
        lines: [
          { clienteId: 'C1', saldoCentavos: 50n },
          { clienteId: 'C1', saldoCentavos: 60n },
        ],
      }),
      (e: unknown) => {
        assert.equal((e as { code?: string }).code, 'SALDOS_INVALIDOS');
        assert.match((e as Error).message, /fechaApertura/);
        assert.match((e as Error).message, /cajaCentavos/);
        assert.match((e as Error).message, /repetido/);
        return true;
      },
    );
    assert.equal(p.saved.length, 0);
  });

  it('refuses a negative cliente saldo (a favor is not a receivable, C-20)', async () => {
    await assert.rejects(
      new GuardarSaldosInicialesUseCase(p).execute({
        ...BASE,
        lines: [{ clienteId: 'C1', saldoCentavos: -5n }],
      }),
      (e: unknown) => (e as { code?: string }).code === 'SALDOS_INVALIDOS',
    );
  });
});

describe('BloquearSaldosInicialesUseCase', () => {
  it('locks once, then is a no-op that says so', async () => {
    const p = port();
    await new GuardarSaldosInicialesUseCase(p).execute(BASE);
    const lock = new BloquearSaldosInicialesUseCase(p);
    assert.equal(await lock.execute({ businessId: 'B1' }), true);
    assert.equal(await lock.execute({ businessId: 'B1' }), false);
  });
});
