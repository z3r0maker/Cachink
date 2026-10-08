import assert from 'node:assert/strict';
import { afterAll, it } from 'vitest';
import {
  CerrarDineroDelTrimestreUseCase,
  PagarMitadUseCase,
  PedirFondeoUseCase,
  RegistrarMovimientoUseCase,
  RevertirMovimientoUseCase,
} from '@xangarro/application/corp';
import { cuentasDeSocios, ReembolsoExcedeSaldoError, type Movement } from '@xangarro/domain/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { borrarLoDe } from './cleanup';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import {
  createFundingCallRepository,
  listFundingCalls,
  listPartnerEntries,
} from '../src/queries/socios';

/**
 * E-03's storage: partner entries by quarter, funding calls with their paid
 * halves, the quarter close and the repayment guard, all against the corp
 * schema. The ledger has no DELETE, so each test writes into a year of its own.
 */
const { url, describe } = integrationSuite();

let seq = 0;
const year = () => 2200 + (((Date.now() / 1000 + seq++ * 13) % 700) | 0);

const mov = (fecha: string, movement: Movement) => ({
  fecha,
  projectId: null,
  concepto: 'Dinero de socio',
  contraparte: null,
  founderId: 'f-socios-test',
  source: 'manual' as const,
  sourceRef: null,
  usd: null,
  deducible: null,
  movement,
});

describe('corp partner accounts', () => {
  afterAll(() => borrarLoDe('f-socios-test'));
  const db = () => createCorpDb(url as string);
  const ledger = () => createCorpLedgerRepository(db());

  it('reads a quarter of partner entries and closes its money', async () => {
    const y = year();
    const uc = new RegistrarMovimientoUseCase(ledger());
    await uc.execute(
      mov(`${y}-08-10`, { kind: 'aportacion_adicional', socio: 2, monto: 30_000_00n }),
    );
    await uc.execute(mov(`${y}-08-11`, { kind: 'comision_bancaria', monto: 10_00n }));
    await uc.execute(mov(`${y}-10-02`, { kind: 'prestamo_socio', socio: 1, monto: 1_000_00n }));

    const q3 = await listPartnerEntries(db(), { desde: `${y}-07-01`, hasta: `${y}-10-01` });
    assert.deepEqual(
      q3.map((e) => e.kind),
      ['aportacion_adicional'],
    );

    const r = await new CerrarDineroDelTrimestreUseCase(ledger()).execute({
      socio: 2,
      trimestre: `${y}-T3`,
      entregables: 20_000_00n,
      hoy: `${y}-10-05`,
      founderId: 'f-socios-test',
    });
    assert.equal(r.prestamo, 10_000_00n);
    const after = await listPartnerEntries(db(), { desde: `${y}-07-01`, hasta: `${y}-10-01` });
    assert.equal(cuentasDeSocios(after)[2].adicional, 20_000_00n);
    assert.equal(cuentasDeSocios(after)[2].prestamo, 10_000_00n);
  });

  it('shows a half as paid until it is reversed', async () => {
    const y = year();
    const calls = createFundingCallRepository(db());
    const call = await new PedirFondeoUseCase(calls).execute({
      concepto: `Fondeo ${y}`,
      total: 20_000_01n,
      vence: `${y}-01-15`,
      hoy: `${y}-01-02`,
      founderId: 'f-socios-test',
    });
    assert.equal(call.porSocio, 10_000_01n);
    const half = await new PagarMitadUseCase(calls, ledger()).execute({
      callId: call.id,
      socio: 1,
      fecha: `${y}-01-05`,
      founderId: 'f-socios-test',
    });

    const listed = (await listFundingCalls(db(), 50)).find((c) => c.id === call.id);
    assert.equal(listed?.mitades[1]?.entryId, half.id);
    assert.equal(listed?.mitades[2], null);
    assert.equal(listed?.total, 20_000_01n);

    await new RevertirMovimientoUseCase(ledger()).execute({
      entryId: half.id,
      fecha: `${y}-01-06`,
      motivo: 'Transferencia rebotada',
      founderId: 'f-socios-test',
    });
    const again = (await listFundingCalls(db(), 50)).find((c) => c.id === call.id);
    assert.equal(again?.mitades[1], null);
  });

  it('refuses a repayment larger than every loan in the books', async () => {
    const y = year();
    await assert.rejects(
      new RegistrarMovimientoUseCase(ledger()).execute(
        mov(`${y}-03-01`, { kind: 'reembolso_socio', socio: 2, monto: 999_999_999_00n }),
      ),
      ReembolsoExcedeSaldoError,
    );
  });
});
