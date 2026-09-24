import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { invocarAsesor, type InvocacionDeps } from '../src/server/asesor/invocacion';

/**
 * P-30's per-business invocation, as a contract: who may call it, what a
 * nameless request answers, and what one business failing costs the rest.
 *
 * No database and no network — the generation itself is a dep. What it
 * *computes* is already proven where it lives: `calcularInsights` and
 * `filtrarPorCadencia` in `packages/domain/tests/asesor/insights.test.ts`
 * (11 tests), and the `notices` writes in
 * `packages/data-pg/tests/asesor-insights.integration.test.ts` (5, against a
 * real Postgres). Re-asserting them here would be the duplication CLAUDE.md
 * §2.3 forbids.
 */
const SECRET = 'cron-only-not-a-real-secret';
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

function pedir(body: unknown, secret: string | null = SECRET): Request {
  return new Request('https://app.xangarro.mx/api/cron/asesor', {
    method: 'POST',
    headers: secret === null ? {} : { authorization: `Bearer ${secret}` },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function deps(over: Partial<InvocacionDeps> = {}): InvocacionDeps & { errores: unknown[] } {
  const errores: unknown[] = [];
  return {
    secret: SECRET,
    now: () => new Date('2026-05-12T09:00:00Z'),
    generar: async (businessId) => ({
      businessId,
      cadencia: 'diario' as const,
      materializados: 3,
      cerrados: 1,
    }),
    report: (error) => void errores.push(error),
    errores,
    ...over,
  };
}

describe('POST /api/cron/asesor', () => {
  it('generates for the business it was given, and reports what it wrote', async () => {
    const d = deps();
    const res = await invocarAsesor(pedir({ businessId: BIZ }), d);

    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), {
      ok: true,
      businessId: BIZ,
      cadencia: 'diario',
      materializados: 3,
      cerrados: 1,
    });
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.deepEqual(d.errores, []);
  });

  it('refuses a caller without the secret, before reading the body', async () => {
    let llamado = false;
    const res = await invocarAsesor(
      pedir({ businessId: BIZ }, 'no-es-el-secreto'),
      deps({
        generar: async () => {
          llamado = true;
          throw new Error('unreachable');
        },
      }),
    );

    assert.equal(res.status, 401);
    assert.equal(llamado, false, 'an unauthenticated call must not reach the generation');
  });

  it('closes rather than opens when CRON_SECRET is unset', async () => {
    const res = await invocarAsesor(pedir({ businessId: BIZ }), deps({ secret: undefined }));
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { error: 'cron_disabled' });
  });

  it('answers 400 when no business is named, so the caller fixes its call', async () => {
    for (const cuerpo of [{}, { businessId: '' }, { businessId: 7 }, 'no-es-json']) {
      const res = await invocarAsesor(pedir(cuerpo), deps());
      assert.equal(res.status, 400, `body ${JSON.stringify(cuerpo)}`);
      assert.deepEqual(await res.json(), { error: 'business_id_requerido' });
    }
  });

  it('a business that throws is reported with its id, and answers 500', async () => {
    const boom = new Error('asesorInputs exploded');
    const d = deps({
      generar: () => Promise.reject(boom),
    });
    const res = await invocarAsesor(pedir({ businessId: BIZ }), d);

    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: 'asesor_failed', businessId: BIZ });
    // Named, because the enqueuer's log is where a stuck tenant is noticed.
    assert.deepEqual(d.errores, [boom]);
  });
});
