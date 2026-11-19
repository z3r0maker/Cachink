import assert from 'node:assert/strict';
import postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';
import {
  RegistrarMovimientoUseCase,
  RevertirMovimientoUseCase,
  type RegistrarMovimientoInput,
} from '@xangarro/application/corp';
import type { Movement } from '@xangarro/domain/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { createCierreRepository, eventosDeCierre } from '../src/queries/cierre';
import { recibidasDelMes, saldoDeBancos } from '../src/queries/cierre-fuentes';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { borrarLoDe } from './cleanup';

/**
 * Cierre del mes's storage (E-14) against rows the seed does not have: a
 * month closed, asked to reopen and reopened by the other founder; the
 * triggers refusing one founder alone; the bank balance; and the month's
 * expenses with and without their CFDI. In a month no other run writes.
 */
const { url, describe } = integrationSuite();
const F1 = 'f-cierre-1';
const F2 = 'f-cierre-2';

const mes = () => {
  const n = (Date.now() % 9_000) + 1;
  return `${6000 + Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`;
};

const gasto = (fecha: string, concepto: string, deducible = true): RegistrarMovimientoInput => ({
  fecha,
  projectId: 'xangarro',
  concepto,
  contraparte: null,
  founderId: F1,
  source: 'manual',
  sourceRef: null,
  usd: null,
  deducible,
  movement: {
    kind: 'gasto',
    categoria: 'administracion',
    subtotal: 1_000_00n,
    iva: 160_00n,
    tratamientoIva: 'acreditable',
    retencionIsr: 0n,
    retencionIva: 0n,
    pagado: true,
  } satisfies Movement,
});

describe('corp cierre', () => {
  let owner: postgres.Sql;
  let corp: postgres.Sql;
  const db = () => createCorpDb(url as string);
  const M = mes();

  beforeAll(() => {
    owner = postgres(process.env.DATABASE_SUPER_URL ?? '', { max: 1, onnotice: () => {} });
    corp = postgres(url as string, { max: 1, onnotice: () => {} });
  });

  afterAll(async () => {
    await Promise.all([owner.end(), corp.end()]);
    await borrarLoDe(F1);
    await borrarLoDe(F2);
  });

  it('reads the expenses, their CFDI and Bancos at the month’s last day', async () => {
    const ledger = createCorpLedgerRepository(db());
    const registrar = new RegistrarMovimientoUseCase(ledger);
    await registrar.execute(gasto(`${M}-03`, 'Cierre sin XML'));
    await registrar.execute(gasto(`${M}-04`, 'Cierre no deducible', false));
    const revertido = await registrar.execute(gasto(`${M}-05`, 'Cierre revertido'));
    await new RevertirMovimientoUseCase(ledger).execute({
      entryId: revertido.id,
      fecha: `${M}-06`,
      motivo: 'duplicado',
      founderId: F1,
    });
    const r = await recibidasDelMes(db(), M);
    assert.equal(r.gastos, 2);
    assert.equal(r.noDeducibles, 1);
    assert.deepEqual(
      r.sinFactura.map((g) => g.concepto),
      ['Cierre sin XML'],
    );
    assert.equal(r.porRevisar, 0);
    // Each standing expense took 1,160.00 out of Bancos; the reversed one nets out.
    // One snapshot for both reads: other suites post earlier-dated rows in parallel.
    const [antes, luego] = await db().transaction(
      async (tx) => [await saldoDeBancos(tx, `${M}-02`), await saldoDeBancos(tx, `${M}-28`)],
      { isolationLevel: 'repeatable read' },
    );
    assert.equal(luego - antes, -2_320_00n);
  });

  it('closes, keeps the history, and the ledger then refuses the month', async () => {
    const cierre = createCierreRepository(db());
    await cierre.confirmarSaldo(M, 48_210_55n, F1);
    await cierre.confirmarSaldo(M, 48_193_15n, F2);
    assert.equal(await cierre.saldoConfirmado(M), 48_193_15n);
    await cierre.cerrar(M, F1);
    assert.ok((await cierre.cerrados()).has(M));
    assert.ok((await cierre.conMovimientos()).has(M));
    await assert.rejects(
      new RegistrarMovimientoUseCase(createCorpLedgerRepository(db())).execute(
        gasto(`${M}-07`, 'Tarde'),
      ),
      /PERIODO_CERRADO|cerrado/i,
    );
  });

  it('refuses one founder alone, whatever the path', async () => {
    const cierre = createCierreRepository(db());
    await assert.rejects(
      corp`DELETE FROM corp.closed_periods WHERE period = ${M}`,
      /permission denied/,
    );
    await assert.rejects(cierre.reabrir(M, F2), (e: Error) => /answer/.test(String(e.cause ?? e)));
    await cierre.pedirReabrir(M, F1, 'Falta la comisión');
    await assert.rejects(cierre.pedirReabrir(M, F2, 'Otra'), (e: Error) =>
      /cannot be asked/.test(String(e.cause ?? e)),
    );
    await assert.rejects(cierre.reabrir(M, F1), (e: Error) => /answer/.test(String(e.cause ?? e)));
    await assert.rejects(
      owner`DELETE FROM corp.closed_periods WHERE period = ${M}`,
      /both founders/,
    );
    assert.ok((await cierre.cerrados()).has(M));
  });

  it('reopens with the other founder’s approval, and the month takes entries again', async () => {
    const cierre = createCierreRepository(db());
    await cierre.reabrir(M, F2);
    assert.equal((await cierre.cerrados()).has(M), false);
    assert.deepEqual(
      (await cierre.eventos(M)).map((e) => [e.kind, e.founderId, e.motivo]),
      [
        ['cerrado', F1, null],
        ['reapertura_pedida', F1, 'Falta la comisión'],
        ['reabierto', F2, null],
      ],
    );
    assert.equal((await eventosDeCierre(db())).get(M)?.length, 3);
    await new RegistrarMovimientoUseCase(createCorpLedgerRepository(db())).execute(
      gasto(`${M}-07`, 'Cierre corregido'),
    );
    // Closed again, a rejected request keeps the lock.
    await cierre.cerrar(M, F2);
    await cierre.pedirReabrir(M, F2, 'Otra vez');
    await cierre.rechazar(M, F1);
    assert.ok((await cierre.cerrados()).has(M));
  });
});
