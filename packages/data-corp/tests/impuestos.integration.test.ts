import assert from 'node:assert/strict';
import { afterAll, it } from 'vitest';
import {
  RegistrarMovimientoUseCase,
  RevertirMovimientoUseCase,
  type RegistrarMovimientoInput,
} from '@xangarro/application/corp';
import { mesesFiscales, type Movement } from '@xangarro/domain/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { createDeclaracionRepository } from '../src/queries/impuestos';
import { fuentesFiscales } from '../src/queries/impuestos-fuentes';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { borrarLoDe } from './cleanup';

/**
 * Impuestos' storage (E-13) against rows the seed does not have: a cobro, an
 * expense with withholdings, a non-deductible one, a reversed one and a tax
 * payment, in a month no other run writes; and a declaration's round trip.
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-impuestos-test';

const mes = () => {
  const n = (Date.now() % 9_000) + 1;
  return `${4000 + Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`;
};

const mov = (fecha: string, movement: Movement, deducible = true): RegistrarMovimientoInput => ({
  fecha,
  projectId: 'xangarro',
  concepto: `E2E impuestos ${movement.kind}`,
  contraparte: null,
  founderId: AUTOR,
  source: 'manual',
  sourceRef: null,
  usd: null,
  deducible,
  movement,
});

const gasto = (subtotal: bigint, retencionIsr = 0n, retencionIva = 0n): Movement => ({
  kind: 'gasto',
  categoria: 'administracion',
  subtotal,
  iva: (subtotal * 16n) / 100n,
  tratamientoIva: 'acreditable',
  retencionIsr,
  retencionIva,
  pagado: true,
});

describe('corp impuestos', () => {
  afterAll(() => borrarLoDe(AUTOR));
  const db = () => createCorpDb(url as string);
  const M = mes();

  it('reads a month of cash-basis figures from the ledger', async () => {
    const ledger = createCorpLedgerRepository(db());
    const registrar = new RegistrarMovimientoUseCase(ledger);
    await registrar.execute(
      mov(`${M}-05`, { kind: 'cobro', subtotal: 10_000_00n, iva: 1_600_00n, destino: 'bancos' }),
    );
    await registrar.execute(mov(`${M}-12`, gasto(3_500_00n, 350_00n, 373_33n)));
    await registrar.execute(mov(`${M}-14`, gasto(1_000_00n), false));
    const reversado = await registrar.execute(mov(`${M}-15`, gasto(2_000_00n, 200_00n)));
    await new RevertirMovimientoUseCase(ledger).execute({
      entryId: reversado.id,
      fecha: `${M}-20`,
      motivo: 'duplicado',
      founderId: AUTOR,
    });
    await registrar.execute(
      mov(`${M}-17`, { kind: 'pago_impuestos', isr: 0n, iva: 500_00n, retenciones: 0n }, false),
    );

    const [m] = mesesFiscales(await fuentesFiscales(db(), M, M));
    assert.equal(m?.ingresos, 10_000_00n);
    assert.equal(m?.deducciones, 3_500_00n);
    assert.equal(m?.ivaTrasladado, 1_600_00n);
    assert.equal(m?.ivaAcreditable, 560_00n + 160_00n);
    assert.equal(m?.retencionIsr, 350_00n);
    assert.equal(m?.retencionIva, 373_33n);
  });

  it('keeps a declaration, corrects it, and lists it by month', async () => {
    const repo = createDeclaracionRepository(db());
    const d = {
      periodo: M,
      isr: 0n,
      iva: 612_85n,
      retencionIsr: 350_00n,
      retencionIva: 373_33n,
      lineaImporte: 1_336_18n,
      lineaVigencia: `${M}-28`,
    };
    await repo.guardar(d, AUTOR);
    await repo.guardar({ ...d, iva: 566_85n, lineaImporte: null, lineaVigencia: null }, AUTOR);
    const leida = await repo.porPeriodo(M);
    assert.equal(leida?.iva, 566_85n);
    assert.equal(leida?.lineaImporte, null);
    assert.deepEqual(
      (await repo.lista(M, M)).map((x) => x.periodo),
      [M],
    );
    assert.equal(await repo.porPeriodo('1999-01'), null);
  });

  it('refuses a negative amount at the database too', async () => {
    const repo = createDeclaracionRepository(db());
    await assert.rejects(
      repo.guardar(
        {
          periodo: '1999-02',
          isr: -1n,
          iva: 0n,
          retencionIsr: 0n,
          retencionIva: 0n,
          lineaImporte: null,
          lineaVigencia: null,
        },
        AUTOR,
      ),
      (e: unknown) => e instanceof Error && String(e.cause).includes('tax_returns_amounts_check'),
    );
  });
});
