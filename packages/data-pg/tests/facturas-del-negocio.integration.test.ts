import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, withBusiness, type Db } from '../src/client';
import { claimCfdiPayment, cfdiPaymentOf, type CfdiPaymentRow } from '../src/queries/cfdi';
import { facturasDelNegocioRows, marcarCfdiEmitido } from '../src/queries/facturas';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * 0019: the tenant reads its own subscription payments — mapped to the
 * customer's four states — through `xangarro.facturas_del_negocio()`, never
 * another business's and never the table itself; the backoffice's
 * `cfdi_marcar_emitido()` turns a "pago sin CFDI" into an issued one.
 */
const { url, describe } = integrationSuite();
const MINE = testId('G');
const THEIRS = testId('G');
const UUID = '6f9619ff-8b86-d011-b42d-00c04fc964ff';
const run = Date.now().toString(36);
const pid = (tag: string) => `in_${run}_${tag}`;

function roleUrl(appUrl: string, role: string): string {
  const u = new URL(appUrl);
  u.username = role;
  u.password = role;
  return u.toString();
}

const payment = (id: string, over: Partial<CfdiPaymentRow> = {}): CfdiPaymentRow => ({
  externalPaymentId: id,
  businessId: MINE,
  route: 'individual_pue',
  status: 'manual',
  totalCentavos: 34_800n,
  paidAt: '2026-09-01T12:00:00.000Z',
  period: '2026-09',
  formaPago: '04',
  description: 'Suscripción Xangarro',
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

describe('xangarro.facturas_del_negocio(): a tenant reads only its own payments', () => {
  let app: Db;
  let billing: Db;
  let owner: postgres.Sql;
  const list = (asTenant: string, asked: string) =>
    withBusiness(app, asTenant, (tx) => facturasDelNegocioRows(tx, asked));

  beforeAll(async () => {
    app = createDb(url as string);
    billing = createDb(roleUrl(url as string, 'xangarro_billing'));
    owner = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => {} });
    const at = (d: number) => `2026-09-0${d}T12:00:00.000Z`;
    for (const row of [
      payment(pid('stamped'), {
        status: 'stamped',
        invoiceProviderId: 'fa_1',
        invoiceUuid: UUID,
        paidAt: at(5),
      }),
      payment(pid('global'), { route: 'global', status: 'pending_global', paidAt: at(4) }),
      payment(pid('manual'), { paidAt: at(3) }),
      payment(pid('claimed'), { status: 'claimed', paidAt: at(2) }),
      payment(pid('refunded'), { status: 'cancelled', paidAt: at(1) }),
      payment(pid('theirs'), { businessId: THEIRS }),
    ]) {
      assert.equal(await claimCfdiPayment(billing, row), true);
    }
  });

  afterAll(async () => {
    for (const db of [app, billing]) await db?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('lists own payments newest first, mapped to the customer states', async () => {
    const rows = await list(MINE, MINE);
    assert.deepEqual(
      rows.map((r) => [r.paymentId, r.estado, r.ruta]),
      [
        [pid('stamped'), 'timbrada', 'individual'],
        [pid('global'), 'en_global', 'global'],
        [pid('manual'), 'pendiente', 'individual'],
        [pid('claimed'), 'error', 'individual'],
      ],
    );
    const [stamped] = rows;
    assert.equal(stamped?.stripeInvoiceId, pid('stamped'));
    assert.equal(stamped?.totalCentavos, 34_800n);
    assert.equal(stamped?.paidAt, '2026-09-05T12:00:00.000Z');
    assert.equal(stamped?.cfdiUuid, UUID);
    assert.equal(stamped?.pdfDisponible && stamped.xmlDisponible, true);
    assert.equal(stamped?.emitidaManual, false);
  });

  it('returns nothing when asked for another business', async () => {
    assert.deepEqual(await list(MINE, THEIRS), []);
    assert.equal((await list(THEIRS, THEIRS)).length, 1);
  });

  it('returns nothing with no tenant claim at all', async () => {
    assert.deepEqual(await facturasDelNegocioRows(app, MINE), []);
  });

  it('does not give the tenant or billing role more than their share', async () => {
    await assert.rejects(app.$client`SELECT 1 FROM cfdi_payments`, /permission denied/);
    await assert.rejects(app.$client`SELECT 1 FROM cfdi_globals`, /permission denied/);
    const denied = /permission denied/;
    await assert.rejects(
      billing.$client`SELECT * FROM xangarro.facturas_del_negocio(${MINE})`,
      denied,
    );
    await assert.rejects(
      app.$client`SELECT xangarro.cfdi_marcar_emitido(${pid('manual')}, ${MINE}, ${UUID})`,
      denied,
    );
  });

  it('grants the marking function to the backoffice role, where one exists', async () => {
    const [r] = await owner<{ ok: boolean | null }[]>`
      SELECT has_function_privilege(oid, 'xangarro.cfdi_marcar_emitido(text, text, text)', 'EXECUTE') AS ok
        FROM pg_roles WHERE rolname = 'xangarro_admin'`;
    assert.notEqual(r?.ok, false);
  });

  it('marking a manual payment with its UUID makes it timbrada, by hand, without download', async () => {
    const input = { paymentId: pid('manual'), businessId: MINE, uuid: UUID };
    const ownerDb = createDb(process.env.DATABASE_SUPER_URL as string);
    try {
      assert.equal(await marcarCfdiEmitido(ownerDb, { ...input, businessId: THEIRS }), false);
      assert.equal(await marcarCfdiEmitido(ownerDb, input), true);
      assert.equal(await marcarCfdiEmitido(ownerDb, input), false, 'already invoiced');
      assert.equal(await marcarCfdiEmitido(ownerDb, { ...input, paymentId: pid('global') }), true);
    } finally {
      await ownerDb.$client.end({ timeout: 5 });
    }
    const row = (await list(MINE, MINE)).find((r) => r.paymentId === pid('manual'));
    assert.equal(row?.estado, 'timbrada');
    assert.equal(row?.emitidaManual, true);
    assert.equal(row?.pdfDisponible, false);
    assert.equal(row?.cfdiUuid, UUID.toUpperCase());
    assert.equal((await cfdiPaymentOf(billing, pid('global')))?.status, 'in_global');
  });
});
