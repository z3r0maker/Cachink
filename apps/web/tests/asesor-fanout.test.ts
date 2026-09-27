import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { fanOutAsesor, type FanOutDeps } from '../src/server/asesor/fanout';

/**
 * P-30's daily fan-out, as a contract: every live business is swept, one
 * tenant's failure is one tenant's failure, and a sweep that outgrows one
 * invocation says so instead of truncating in silence.
 *
 * No database and no network — enumeration and generation are both deps. What
 * the generation *computes* is proven where it lives (`asesor-runtime.test.ts`,
 * `packages/domain/tests/asesor/insights.test.ts`,
 * `packages/data-pg/tests/asesor-insights.integration.test.ts`); re-asserting
 * it here would be the duplication CLAUDE.md §2.3 forbids. That
 * `liveBusinessIds` really returns the live set, on the role that may read it,
 * is `packages/data-pg/tests/asesor-fanout.integration.test.ts`.
 */
const AHORA = new Date('2026-05-12T09:00:00Z');
const IDS = [
  '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  '01J0A0A0A0A0A0A0A0A0A0A0A0',
  '01J1B1B1B1B1B1B1B1B1B1B1B1',
];

interface Espia {
  readonly pedidos: string[];
  readonly errores: { error: unknown; endpoint: string; businessId?: string }[];
}

function deps(over: Partial<FanOutDeps> = {}): FanOutDeps & Espia {
  const pedidos: string[] = [];
  const errores: Espia['errores'] = [];
  return {
    negocios: async () => IDS,
    generar: async (businessId) => {
      pedidos.push(businessId);
      return { businessId, cadencia: 'diario' as const, materializados: 2, cerrados: 1 };
    },
    report: (error, scope) => void errores.push({ error, ...scope }),
    limiteMs: 60_000,
    transcurrido: () => 0,
    pedidos,
    errores,
    ...over,
  };
}

describe('the Asesor daily fan-out', () => {
  it('sweeps every live business and sums what the run wrote', async () => {
    const d = deps();
    const r = await fanOutAsesor(d, AHORA);

    assert.deepEqual(d.pedidos, IDS, 'every live business, in the order enumerated');
    assert.equal(r.negocios, 3);
    assert.equal(r.generados, 3);
    assert.equal(r.materializados, 6);
    assert.equal(r.cerrados, 3);
    assert.deepEqual(r.fallidos, []);
    assert.equal(r.restantes, 0);
    assert.deepEqual(d.errores, [], 'a clean sweep reports nothing');
  });

  it('keeps sweeping when one tenant fails, and reports it under its own id', async () => {
    const roto = IDS[1];
    const d = deps({
      generar: async (businessId) => {
        if (businessId === roto) throw new Error('relación «sales» no existe');
        return { businessId, cadencia: 'diario' as const, materializados: 2, cerrados: 1 };
      },
    });
    const r = await fanOutAsesor(d, AHORA);

    // The point of the test: the third business ran *after* the second threw.
    assert.equal(r.negocios, 3, 'all three were enumerated');
    assert.equal(r.generados, 2, 'the two healthy tenants were generated');
    assert.equal(r.materializados, 4, 'the failed tenant contributes nothing to the tally');
    assert.deepEqual(r.fallidos, [{ businessId: roto, error: 'relación «sales» no existe' }]);
    assert.equal(d.errores.length, 1);
    assert.equal(d.errores[0]?.businessId, roto, 'reported under the tenant that failed');
    assert.equal(d.errores[0]?.endpoint, 'cron/asesor');
  });

  it('carries a non-Error throw through as text rather than losing it', async () => {
    const d = deps({
      negocios: async () => [IDS[0] as string],
      generar: async () => {
        throw 'ECONNRESET';
      },
    });
    const r = await fanOutAsesor(d, AHORA);

    assert.deepEqual(r.fallidos, [{ businessId: IDS[0] as string, error: 'ECONNRESET' }]);
    assert.equal(r.generados, 0);
  });

  it('stops at the deadline and says how many it never reached', async () => {
    let tick = 0;
    const d = deps({ limiteMs: 100, transcurrido: () => (tick += 60) - 60 });
    const r = await fanOutAsesor(d, AHORA);

    // 0ms → first runs; 60ms → second runs; 120ms ≥ 100ms → stop.
    assert.deepEqual(d.pedidos, IDS.slice(0, 2));
    assert.equal(r.generados, 2);
    assert.equal(r.restantes, 1, 'the tenant the deadline cut off is counted, not hidden');
    assert.equal(d.errores.length, 1, 'a truncated sweep is reported, not silent');
    assert.match(String((d.errores[0]?.error as Error).message), /1 negocios sin recorrer/);
    assert.equal(
      d.errores[0]?.businessId,
      undefined,
      'truncation is the run’s fault, not a tenant’s',
    );
  });

  it('answers a clean zero when there is no live business at all', async () => {
    const d = deps({ negocios: async () => [] });
    const r = await fanOutAsesor(d, AHORA);

    assert.deepEqual(r, {
      negocios: 0,
      generados: 0,
      materializados: 0,
      cerrados: 0,
      fallidos: [],
      restantes: 0,
    });
    assert.deepEqual(d.errores, [], 'an empty estate is not a truncated sweep');
  });

  it('lets a failure to enumerate fail the whole run', async () => {
    const d = deps({
      negocios: async () => {
        throw new Error('METERING_DATABASE_URL is not set.');
      },
    });
    // Not caught here: not knowing who the tenants are is the run failing, and
    // the route answers 500 so it shows red in Vercel's cron log. Swallowing it
    // would report a successful sweep of zero businesses every night.
    await assert.rejects(() => fanOutAsesor(d, AHORA), /METERING_DATABASE_URL/);
    assert.deepEqual(d.pedidos, []);
  });
});
