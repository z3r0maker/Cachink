import assert from 'node:assert/strict';
import { afterAll, it } from 'vitest';
import {
  RegistrarMovimientoUseCase,
  RevertirMovimientoUseCase,
  type RegistrarMovimientoInput,
} from '@xangarro/application/corp';
import type { Movement } from '@xangarro/domain/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { movimientosDeCaja } from '../src/queries/caja';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { borrarLoDe } from './cleanup';

/**
 * Cash's read (E-16) against rows the seed does not have: a cobro to Stripe
 * and its payout, partner money, an expense paid and reversed, one on credit,
 * and a movement after the cut.
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-caja-test';

/** A month no other run writes, years past every other suite's. */
const mes = () => {
  const n = (Date.now() % 9_000) + 1;
  return `${5000 + Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`;
};

const movimiento = (fecha: string, movement: Movement): RegistrarMovimientoInput => ({
  fecha,
  projectId: 'xangarro',
  concepto: `E2E caja ${movement.kind}`,
  contraparte: null,
  founderId: AUTOR,
  source: 'manual',
  sourceRef: null,
  usd: null,
  deducible: true,
  movement,
});

const gasto = (subtotal: bigint, pagado: boolean): Movement => ({
  kind: 'gasto',
  categoria: 'administracion',
  subtotal,
  iva: 0n,
  tratamientoIva: 'exento',
  retencionIsr: 0n,
  retencionIva: 0n,
  pagado,
});

describe('corp cash read', () => {
  afterAll(() => borrarLoDe(AUTOR));

  it('nets each entry on cash and marks partner money', async () => {
    const db = createCorpDb(url as string);
    const ledger = createCorpLedgerRepository(db);
    const registrar = new RegistrarMovimientoUseCase(ledger);
    const m = mes();
    const alta = (dia: string, mv: Movement) => registrar.execute(movimiento(`${m}-${dia}`, mv));

    const cobro = await alta('05', {
      kind: 'cobro',
      subtotal: 10_000_00n,
      iva: 1_600_00n,
      destino: 'stripe_por_depositar',
    });
    const payout = await alta('07', { kind: 'payout', bruto: 11_600_00n, comision: 400_00n });
    const capital = await alta('08', { kind: 'aportacion_capital', socio: 1, monto: 50_000_00n });
    const prestamo = await alta('09', { kind: 'prestamo_socio', socio: 2, monto: 5_000_00n });
    const pagado = await alta('10', gasto(1_000_00n, true));
    const reversa = await new RevertirMovimientoUseCase(ledger).execute({
      entryId: pagado.id,
      fecha: `${m}-11`,
      motivo: 'Cargo duplicado',
      founderId: AUTOR,
    });
    const credito = await alta('12', gasto(2_000_00n, false));
    const despues = await alta('25', gasto(300_00n, true));

    const mios = new Map(
      [cobro, payout, capital, prestamo, pagado, reversa, credito, despues].map((e, i) => [
        e.id,
        i,
      ]),
    );
    const leidos = (await movimientosDeCaja(db, `${m}-20`))
      .filter((x) => mios.has(x.entryId))
      .sort((a, b) => (mios.get(a.entryId) ?? 0) - (mios.get(b.entryId) ?? 0));

    assert.deepEqual(
      leidos.map((x) => [x.entryId, x.fecha, x.importe, x.socios]),
      [
        [cobro.id, `${m}-05`, 11_600_00n, false],
        [payout.id, `${m}-07`, -400_00n, false],
        [capital.id, `${m}-08`, 50_000_00n, true],
        [prestamo.id, `${m}-09`, 5_000_00n, true],
        [pagado.id, `${m}-10`, -1_000_00n, false],
        [reversa.id, `${m}-11`, 1_000_00n, false],
      ],
      'the invoice on credit moved no cash, and the 25th is after the cut',
    );
  });
});
