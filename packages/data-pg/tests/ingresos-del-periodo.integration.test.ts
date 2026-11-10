import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, type Db } from '../src/client';
import { claimCfdiPayment, type CfdiPaymentRow } from '../src/queries/cfdi';
import { marcarCfdiGlobal } from '../src/queries/facturas';
import { ingresosDelPeriodo } from '../src/queries/ingresos';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * 0055: the backoffice reads a month of Xangarro's own subscription payments
 * and their CFDIs (E-10, board CD-06i) through
 * `xangarro.ingresos_del_periodo()`: who paid, what was issued, the global
 * that took a payment without fiscal data and what a refund gave back. Only
 * `xangarro_admin` may call it; nobody else reads the table.
 */
const { url, describe } = integrationSuite();
const NEGOCIO = testId('I');
const UUID = '6f9619ff-8b86-d011-b42d-00c04fc964ff';
const GLOBAL = '7a0f1e22-1b2c-4d3e-8f90-112233445566';
const run = Date.now().toString(36);
const pid = (tag: string) => `in_${run}_${tag}`;
/** A month no other run uses: `cfdi_marcar_global` marks a whole period. */
const PERIODO = `2${String(Date.now() % 900).padStart(3, '0')}-07`;

function roleUrl(appUrl: string, role: string): string {
  const u = new URL(appUrl);
  u.username = role;
  u.password = role;
  return u.toString();
}

const payment = (id: string, over: Partial<CfdiPaymentRow> = {}): CfdiPaymentRow => ({
  externalPaymentId: id,
  businessId: NEGOCIO,
  route: 'individual_pue',
  status: 'manual',
  totalCentavos: 49_900n,
  paidAt: `${PERIODO}-20T18:00:00.000Z`,
  period: PERIODO,
  formaPago: '04',
  description: 'Plan Negocio',
  receptor: null,
  globalReasons: null,
  invoiceProviderId: null,
  invoiceUuid: null,
  complementProviderId: null,
  complementUuid: null,
  globalId: null,
  cancellation: null,
  ...over,
});

const receptor = {
  rfc: 'TAQ010101AB1',
  nombre: 'Taquería E2E',
  regimenFiscal: '626',
  usoCfdi: 'G03',
  codigoPostal: '06600',
};

describe('xangarro.ingresos_del_periodo(): a month of Xangarro’s issued invoices', () => {
  let billing: Db;
  let admin: Db;
  let app: Db;
  let owner: postgres.Sql;

  beforeAll(async () => {
    billing = createDb(roleUrl(url as string, 'xangarro_billing'));
    admin = createDb(roleUrl(url as string, 'xangarro_admin'));
    app = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => {} });
    const dia = (d: number) => `${PERIODO}-${String(d).padStart(2, '0')}T18:00:00.000Z`;
    for (const row of [
      payment(pid('timbrada'), {
        status: 'stamped',
        route: 'individual_ppd',
        receptor,
        invoiceUuid: UUID,
        complementUuid: GLOBAL,
        paidAt: dia(30),
      }),
      payment(pid('global'), {
        route: 'global',
        status: 'pending_global',
        totalCentavos: 23_000n,
        paidAt: dia(25),
      }),
      payment(pid('manual'), { receptor, paidAt: dia(20) }),
      payment(pid('reembolso'), { status: 'cancelled', receptor, paidAt: dia(12) }),
      payment(pid('otro_mes'), { period: '2026-01', paidAt: '2026-01-05T18:00:00.000Z' }),
    ]) {
      assert.equal(await claimCfdiPayment(billing, row), true);
    }
    await owner`UPDATE cfdi_payments SET credit_notes = ${owner.json([
      { refundId: 're_1', providerId: 'p1', uuid: UUID, totalCentavos: '30000' },
      { refundId: 're_2', providerId: 'p2', uuid: UUID, totalCentavos: '19900' },
    ])} WHERE external_payment_id = ${pid('reembolso')}`;
    assert.equal(await marcarCfdiGlobal(admin, { period: PERIODO, uuid: GLOBAL }), 1);
  });

  afterAll(async () => {
    for (const db of [billing, admin, app]) await db?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('lists the month’s payments newest first, with who paid and what was issued', async () => {
    const rows = await ingresosDelPeriodo(admin, PERIODO);
    assert.deepEqual(
      rows.map((r) => [r.paymentId, r.route, r.status]),
      [
        [pid('timbrada'), 'individual_ppd', 'stamped'],
        [pid('global'), 'global', 'in_global'],
        [pid('manual'), 'individual_pue', 'manual'],
        [pid('reembolso'), 'individual_pue', 'cancelled'],
      ],
    );
    const [timbrada, global, manual] = rows;
    assert.ok(timbrada && global && manual);
    assert.deepEqual(
      [
        timbrada.receptorRfc,
        timbrada.receptorNombre,
        timbrada.invoiceUuid,
        timbrada.complementUuid,
      ],
      ['TAQ010101AB1', 'Taquería E2E', UUID, GLOBAL],
    );
    assert.deepEqual(
      [timbrada.paidAt, timbrada.totalCentavos],
      [`${PERIODO}-30T18:00:00.000Z`, 49_900n],
    );
    assert.deepEqual(
      [global.receptorRfc, global.globalUuid, global.totalCentavos],
      [null, GLOBAL.toUpperCase(), 23_000n],
    );
    assert.deepEqual(
      [manual.description, manual.globalUuid, manual.notasDeCreditoCentavos],
      ['Plan Negocio', null, 0n],
    );
  });

  it('adds up a payment’s credit notes, kept as strings of centavos', async () => {
    const rows = await ingresosDelPeriodo(admin, PERIODO);
    assert.equal(
      rows.find((r) => r.paymentId === pid('reembolso'))?.notasDeCreditoCentavos,
      49_900n,
    );
  });

  it('returns nothing for a month without payments, or one that is not a month', async () => {
    assert.deepEqual(await ingresosDelPeriodo(admin, '2190-02'), []);
    assert.deepEqual(await ingresosDelPeriodo(admin, 'cualquiera'), []);
  });

  it('is the backoffice’s alone', async () => {
    const denied = /permission denied/;
    await assert.rejects(
      app.$client`SELECT * FROM xangarro.ingresos_del_periodo(${PERIODO})`,
      denied,
    );
    await assert.rejects(
      billing.$client`SELECT * FROM xangarro.ingresos_del_periodo(${PERIODO})`,
      denied,
    );
    await assert.rejects(admin.$client`SELECT 1 FROM cfdi_payments`, denied);
  });
});
