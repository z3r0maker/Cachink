import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { beforeEach, describe, it, vi } from 'vitest';

import type { IsoDate } from '@xangarro/domain';

/**
 * The Asesor's deterministic pipeline, which exists once (CLAUDE.md §2.3).
 *
 * Two callers need the same four steps: the page materialises on read
 * (ADR-088) and the scheduled run writes on a cadence (P-30). While they were
 * two copies, a divergence was silent and destructive — the page's fifth insight
 * would overwrite the run's rows with different ones, and nobody would see a
 * failure. So this covers both halves of the rule: what the one pipeline does,
 * and that neither caller has grown its own again.
 */
const calls: string[] = [];

vi.mock('@xangarro/domain', () => ({
  calcularInsights: vi.fn((inputs: { readonly n: number }) => {
    calls.push('calcularInsights');
    return Array.from({ length: inputs.n }, (_, i) => ({ clave: `i${i}`, urgencia: i }));
  }),
  filtrarPorCadencia: vi.fn((insights: readonly unknown[], cadencia: string) => {
    calls.push(`filtrarPorCadencia:${cadencia}`);
    return cadencia === 'semanal' ? insights.slice(0, 2) : insights;
  }),
}));

vi.mock('@xangarro/data-pg', () => ({
  asesorInputs: vi.fn(async () => {
    calls.push('asesorInputs');
    return { n: 5, cuenta: { diasDeHistorial: 3 } };
  }),
  materializarInsights: vi.fn(async (_tx: unknown, _biz: string, visibles: readonly unknown[]) => {
    calls.push('materializarInsights');
    return { materializados: visibles.length, cerrados: 1 };
  }),
}));

vi.mock('../src/server/db', () => ({
  withTenant: vi.fn(async (_biz: string, fn: (tx: unknown) => unknown) => fn({ tx: true })),
}));

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const DIA = '2026-05-12' as IsoDate;

async function load() {
  const mod = await import('../src/server/asesor/pipeline');
  return mod.materializarParaNegocio;
}

describe('materializarParaNegocio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.length = 0;
  });

  it('returns what it wrote and what it computed from', async () => {
    // `inputs` is the reason the page can share this: it needs the same rows for
    // `calcularCapacidades`, and reading them twice is how two numbers diverge.
    const materializar = await load();
    const r = await materializar(BIZ, 'diario', DIA);

    assert.deepEqual(r, {
      inputs: { n: 5, cuenta: { diasDeHistorial: 3 } },
      materializados: 5,
      cerrados: 1,
    });
  });

  it('computes, then filters, then writes — in that order', async () => {
    // ADR-056's ordering. Anything that wrote before filtering would store rows
    // the tier may not receive.
    const materializar = await load();
    await materializar(BIZ, 'diario', DIA);

    assert.deepEqual(calls, [
      'asesorInputs',
      'calcularInsights',
      'filtrarPorCadencia:diario',
      'materializarInsights',
    ]);
  });

  it('a weekly cadencia stores only the two it receives (ADR-059)', async () => {
    const materializar = await load();
    const r = await materializar(BIZ, 'semanal', DIA);

    assert.equal(r.materializados, 2, 'five computed, two stored');
  });

  it('reads the day it is given, not a clock of its own', async () => {
    // The caller owns the business day: the page's `hoy()` and the scheduled
    // run's must be the same day, and this module must not resolve a third.
    const dataPg = await import('@xangarro/data-pg');
    const materializar = await load();
    await materializar(BIZ, 'diario', '2026-01-31' as IsoDate);

    const [, dia] = vi.mocked(dataPg.asesorInputs).mock.calls[0] ?? [];
    assert.equal(dia, '2026-01-31');
  });

  it('a tenant with nothing to say writes nothing, and does not fail', async () => {
    const dataPg = await import('@xangarro/data-pg');
    vi.mocked(dataPg.asesorInputs).mockResolvedValueOnce({ n: 0, cuenta: {} } as never);
    const materializar = await load();
    const r = await materializar(BIZ, 'completo', DIA);

    assert.equal(r.materializados, 0);
  });
});

/**
 * The duplication guard. A caller that reached for the domain or the queries
 * directly would be writing the pipeline a second time, and the failure that
 * follows is invisible — so it fails here instead.
 */
describe('the pipeline has exactly one implementation', () => {
  const CALLERS = ['../src/server/asesor.ts', '../src/server/asesor/runtime.ts'] as const;
  const PROPIO = ['calcularInsights', 'filtrarPorCadencia', 'asesorInputs', 'materializarInsights'];

  for (const caller of CALLERS) {
    it(`${caller} goes through the pipeline instead of repeating it`, async () => {
      const src = await readFile(new URL(caller, import.meta.url), 'utf8');

      for (const paso of PROPIO) {
        assert.ok(!src.includes(paso), `${caller} still calls ${paso} itself`);
      }
      assert.match(src, /from '\.\/(asesor\/)?pipeline'/, `${caller} imports the pipeline`);
    });
  }
});
