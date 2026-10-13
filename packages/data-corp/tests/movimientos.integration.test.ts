import assert from 'node:assert/strict';
import { afterAll, it } from 'vitest';
import { RegistrarMovimientoUseCase, RevertirMovimientoUseCase } from '@xangarro/application/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { borrarLoDe } from './cleanup';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { getMovimiento, listMovimientos, monthBounds } from '../src/queries/movimientos';

/**
 * The Movimientos screen's reads (E-02): a month's entries with their lines,
 * newest first, and which of them were reversed. The ledger has no DELETE, so
 * every test writes into a month of its own.
 */
const { url, describe } = integrationSuite();

let seq = 0;
const month = () => {
  const n = (Date.now() + seq++ * 7) % 9600;
  return `${2100 + Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`;
};

const comision = (fecha: string, concepto: string) => ({
  fecha,
  projectId: 'xangarro',
  concepto,
  contraparte: 'Banco',
  founderId: 'f-movs-test',
  source: 'manual' as const,
  sourceRef: null,
  usd: null,
  deducible: true,
  movement: { kind: 'comision_bancaria' as const, monto: 12_50n },
});

describe('corp movimientos reads', () => {
  afterAll(() => borrarLoDe('f-movs-test'));
  const db = () => createCorpDb(url as string);

  it('lists one month, newest first, and marks the reversed entry', async () => {
    const mes = month();
    const repo = createCorpLedgerRepository(db());
    const registrar = new RegistrarMovimientoUseCase(repo);
    const early = await registrar.execute(comision(`${mes}-03`, 'Primera'));
    const late = await registrar.execute(comision(`${mes}-20`, 'Segunda'));
    const rev = await new RevertirMovimientoUseCase(repo).execute({
      entryId: early.id,
      fecha: `${mes}-21`,
      motivo: 'Cobro indebido',
      founderId: 'f-movs-test',
    });

    const list = await listMovimientos(db(), mes);
    assert.deepEqual(
      list.map((m) => m.id),
      [rev.id, late.id, early.id],
    );
    assert.equal(list[2]?.reversedBy, rev.id);
    assert.equal(list[1]?.reversedBy, null);
    assert.equal(list[1]?.lines[0]?.debe, 12_50n);
  });

  it('reads one entry with its reversal, and nothing for an unknown id', async () => {
    const mes = month();
    const repo = createCorpLedgerRepository(db());
    const saved = await new RegistrarMovimientoUseCase(repo).execute(comision(`${mes}-05`, 'Sola'));
    const found = await getMovimiento(db(), saved.id);
    assert.equal(found?.concepto, 'Sola');
    assert.equal(found?.reversedBy, null);
    assert.equal(await getMovimiento(db(), 'no-such-entry'), null);
  });

  it('refuses a period that is not a month', () => {
    assert.equal(monthBounds('2026-13'), null);
    assert.deepEqual(monthBounds('2026-12'), ['2026-12-01', '2027-01-01']);
  });
});
