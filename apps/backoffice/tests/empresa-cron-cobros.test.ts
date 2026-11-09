import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { ResultadoImportacion } from '@xangarro/application/corp';

import { handleCobrosCron, type CobrosCronDeps } from '../src/server/empresa/cron-cobros';

/**
 * E-10's daily import: Vercel's cron asks with the secret; last month and
 * this one are imported (a payment can arrive late for the first days), and
 * what was posted, reversed or left in a closed month is answered.
 */
const pedido = (secret?: string) =>
  new Request('https://admin.x/api/cron/empresa-cobros', {
    headers: secret === undefined ? {} : { authorization: `Bearer ${secret}` },
  });

const resultado: ResultadoImportacion = { registrados: 3, revertidos: 1, omitidos: 0 };

function deps(o: Partial<CobrosCronDeps> = {}) {
  const pedidos: { periodos: readonly string[]; hoy: string }[] = [];
  const d: CobrosCronDeps = {
    secret: 's3cret',
    hoy: () => '2026-11-09',
    importar: async (input) => {
      pedidos.push(input);
      return resultado;
    },
    log: () => undefined,
    ...o,
  };
  return { d, pedidos };
}

describe('handleCobrosCron (E-10)', () => {
  it('imports last month and this one, and answers what it did', async () => {
    const { d, pedidos } = deps();
    const res = await handleCobrosCron(pedido('s3cret'), d);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, ...resultado });
    assert.deepEqual(pedidos, [{ periodos: ['2026-10', '2026-11'], hoy: '2026-11-09' }]);
  });

  it('crosses the year in January', async () => {
    const { d, pedidos } = deps({ hoy: () => '2027-01-02' });
    await handleCobrosCron(pedido('s3cret'), d);
    assert.deepEqual(pedidos[0]?.periodos, ['2026-12', '2027-01']);
  });

  it('refuses without the secret, and is off without one configured', async () => {
    assert.equal((await handleCobrosCron(pedido('otro'), deps().d)).status, 401);
    assert.equal((await handleCobrosCron(pedido(), deps().d)).status, 401);
    assert.equal(
      (await handleCobrosCron(pedido('s3cret'), deps({ secret: undefined }).d)).status,
      503,
    );
  });

  it('does nothing while «Empresa» has no database, and says so', async () => {
    const res = await handleCobrosCron(pedido('s3cret'), deps({ importar: null }).d);
    assert.deepEqual([res.status, await res.json()], [200, { ok: true, reason: 'corp_disabled' }]);
  });

  it('answers 500 when the import fails, after logging why', async () => {
    const vistos: string[] = [];
    const { d } = deps({
      importar: async () => {
        throw new Error('boom');
      },
      log: (m) => vistos.push(m),
    });
    const res = await handleCobrosCron(pedido('s3cret'), d);
    assert.deepEqual([res.status, await res.json()], [500, { error: 'import_failed' }]);
    assert.deepEqual(vistos, ['cobros: the import failed']);
  });
});
