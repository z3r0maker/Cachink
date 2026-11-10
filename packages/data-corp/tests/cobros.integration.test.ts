import assert from 'node:assert/strict';
import { afterAll, it } from 'vitest';
import { IMPORTADOR_COBROS, importarCobros, type PagoDeXangarro } from '@xangarro/application/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { cobrosDePagos } from '../src/queries/cobros';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { borrarLoDe } from './cleanup';

/**
 * E-10 in the corp schema: each Stripe payment of Xangarro is posted once as
 * its own cobro (source `billing`, its id the ref), a full refund reverses
 * that entry, and Facturas › Emitidas finds each payment's cobro by its id.
 */
const { url, describe } = integrationSuite();
const run = Date.now().toString(36);
const pid = (tag: string) => `in_${run}_${tag}`;

describe('Xangarro’s payments as cobros', () => {
  const pagos: Record<string, PagoDeXangarro[]> = {};
  const deps = () => ({
    ledger: createCorpLedgerRepository(createCorpDb(url as string)),
    ingresos: { pagosDelPeriodo: async (p: string) => pagos[p] ?? [] },
  });
  const pago = (tag: string, reembolsado = false): PagoDeXangarro => ({
    paymentId: pid(tag),
    pagadoEl: '2026-10-30',
    total: 499_00n,
    cliente: 'Taquería E2E',
    reembolsado,
  });
  const importar = () => importarCobros(deps(), { periodos: ['2026-10'], hoy: '2026-11-09' });

  // Only this file posts as the import.
  afterAll(() => borrarLoDe(IMPORTADOR_COBROS));

  it('posts each payment once, finds it by its id, and reverses only the refunded one', async () => {
    pagos['2026-10'] = [pago('a'), pago('b')];
    assert.deepEqual(await importar(), { registrados: 2, revertidos: 0, omitidos: 0 });
    assert.deepEqual(await importar(), { registrados: 0, revertidos: 0, omitidos: 0 });

    pagos['2026-10'] = [pago('a', true), pago('b')];
    assert.deepEqual(await importar(), { registrados: 0, revertidos: 1, omitidos: 0 });

    const db = createCorpDb(url as string);
    const cobros = await cobrosDePagos(db, [pid('a'), pid('b'), pid('nunca')]);
    assert.deepEqual(
      [cobros.get(pid('a'))?.revertida, cobros.get(pid('b'))?.revertida, cobros.has(pid('nunca'))],
      [true, false, false],
    );
    assert.deepEqual(await cobrosDePagos(db, []), new Map());
  });
});
