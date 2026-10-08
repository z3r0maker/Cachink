import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  cuentasDeSocios,
  MontoInvalidoError,
  ReembolsoExcedeSaldoError,
  type Movement,
} from '@xangarro/domain/corp';

import {
  CerrarDineroDelTrimestreUseCase,
  ConceptoRequeridoError,
  LlamadaDesconocidaError,
  PagarMitadUseCase,
  PedirFondeoUseCase,
  RegistrarMovimientoUseCase,
  RevertirMovimientoUseCase,
  TrimestreEnCursoError,
  VencimientoInvalidoError,
} from '../../src/corp/index.js';
import { FakeCalls, FakeLedger } from './fake-ledger.js';

/** E-03 (agreement Quinta): partner money through the ledger's use cases. */
const socioMov = (fecha: string, movement: Movement) => ({
  fecha,
  projectId: null,
  concepto: 'Dinero de socio',
  contraparte: null,
  founderId: 'f1',
  source: 'manual' as const,
  sourceRef: null,
  usd: null,
  deducible: null,
  movement,
});

describe('repayments', () => {
  it('repays a loan up to its balance', async () => {
    const repo = new FakeLedger();
    const uc = new RegistrarMovimientoUseCase(repo);
    await uc.execute(
      socioMov('2026-10-01', { kind: 'prestamo_socio', socio: 1, monto: 8_000_00n }),
    );
    await uc.execute(
      socioMov('2026-10-05', { kind: 'reembolso_socio', socio: 1, monto: 8_000_00n }),
    );
    assert.equal(cuentasDeSocios(repo.entries)[1].prestamo, 0n);
  });

  it('refuses a repayment over the balance', async () => {
    const repo = new FakeLedger();
    const uc = new RegistrarMovimientoUseCase(repo);
    await uc.execute(
      socioMov('2026-10-01', { kind: 'prestamo_socio', socio: 1, monto: 8_000_00n }),
    );
    await assert.rejects(
      uc.execute(socioMov('2026-10-05', { kind: 'reembolso_socio', socio: 1, monto: 8_000_01n })),
      ReembolsoExcedeSaldoError,
    );
  });

  it("refuses to repay one partner out of the other's loan", async () => {
    const repo = new FakeLedger();
    const uc = new RegistrarMovimientoUseCase(repo);
    await uc.execute(
      socioMov('2026-10-01', { kind: 'prestamo_socio', socio: 2, monto: 8_000_00n }),
    );
    await assert.rejects(
      uc.execute(socioMov('2026-10-05', { kind: 'reembolso_socio', socio: 1, monto: 1n })),
      ReembolsoExcedeSaldoError,
    );
  });

  it('refuses to reverse a loan that was already partly repaid', async () => {
    const repo = new FakeLedger();
    const uc = new RegistrarMovimientoUseCase(repo);
    const loan = await uc.execute(
      socioMov('2026-10-01', { kind: 'prestamo_socio', socio: 1, monto: 8_000_00n }),
    );
    await uc.execute(
      socioMov('2026-10-05', { kind: 'reembolso_socio', socio: 1, monto: 3_000_00n }),
    );
    await assert.rejects(
      new RevertirMovimientoUseCase(repo).execute({
        entryId: loan.id,
        fecha: '2026-10-06',
        motivo: 'Error',
        founderId: 'f1',
      }),
      ReembolsoExcedeSaldoError,
    );
  });
});

describe('funding by halves', () => {
  const pedir = (
    calls: FakeCalls,
    over: Partial<{ concepto: string; vence: string; total: bigint }> = {},
  ) =>
    new PedirFondeoUseCase(calls).execute({
      concepto: 'Fondeo de octubre',
      total: 20_000_00n,
      vence: '2026-10-15',
      hoy: '2026-10-08',
      founderId: 'f1',
      ...over,
    });

  it('asks each partner for half and records each half once', async () => {
    const calls = new FakeCalls();
    const repo = new FakeLedger();
    const call = await pedir(calls);
    assert.equal(call.porSocio, 10_000_00n);
    const pagar = new PagarMitadUseCase(calls, repo);
    const input = { callId: call.id, socio: 1 as const, fecha: '2026-10-09', founderId: 'f1' };
    const first = await pagar.execute(input);
    const again = await pagar.execute(input);
    assert.equal(again.id, first.id);
    assert.equal(cuentasDeSocios(repo.entries)[1].fondeo, 10_000_00n);
    assert.equal(cuentasDeSocios(repo.entries)[1].adicional, 0n);
  });

  it('refuses a call without a concept, a past deadline or no amount', async () => {
    const calls = new FakeCalls();
    await assert.rejects(pedir(calls, { concepto: ' ' }), ConceptoRequeridoError);
    await assert.rejects(pedir(calls, { vence: '2026-10-07' }), VencimientoInvalidoError);
    await assert.rejects(pedir(calls, { total: 0n }), MontoInvalidoError);
  });

  it('refuses a half of a call that does not exist', async () => {
    await assert.rejects(
      new PagarMitadUseCase(new FakeCalls(), new FakeLedger()).execute({
        callId: 'nope',
        socio: 2,
        fecha: '2026-10-09',
        founderId: 'f1',
      }),
      LlamadaDesconocidaError,
    );
  });
});

describe('the quarter money close', () => {
  const close = (repo: FakeLedger, entregables: bigint, hoy = '2026-10-08') =>
    new CerrarDineroDelTrimestreUseCase(repo).execute({
      socio: 2,
      trimestre: '2026-T3',
      entregables,
      hoy,
      founderId: 'f1',
    });

  const withAdicional = async () => {
    const repo = new FakeLedger();
    await new RegistrarMovimientoUseCase(repo).execute(
      socioMov('2026-09-10', { kind: 'aportacion_adicional', socio: 2, monto: 30_000_00n }),
    );
    return repo;
  };

  it('splits additional money over the cap into pool value and a loan', async () => {
    const repo = await withAdicional();
    const r = await close(repo, 20_000_00n);
    assert.equal(r.bolsa, 20_000_00n);
    assert.equal(r.prestamo, 10_000_00n);
    assert.equal(r.entry?.fecha, '2026-09-30');
    const c = cuentasDeSocios(repo.entries)[2];
    assert.equal(c.adicional, 20_000_00n);
    assert.equal(c.prestamo, 10_000_00n);
  });

  it('posts nothing when the money fits under the cap', async () => {
    const repo = await withAdicional();
    const r = await close(repo, 50_000_00n);
    assert.equal(r.entry, null);
    assert.equal(repo.entries.length, 1);
  });

  it('closes once: a second close reports the first excess', async () => {
    const repo = await withAdicional();
    await close(repo, 20_000_00n);
    const again = await close(repo, 0n);
    assert.equal(again.prestamo, 10_000_00n);
    assert.equal(repo.entries.length, 2);
  });

  it('refuses a quarter that has not ended', async () => {
    const repo = await withAdicional();
    await assert.rejects(close(repo, 0n, '2026-09-30'), TrimestreEnCursoError);
  });
});
