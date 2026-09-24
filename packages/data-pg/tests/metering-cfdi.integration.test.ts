import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';

import { createDb, type Db } from '../src/client';
import {
  beginUsageNotice,
  finishUsageNotice,
  saveUsageCounters,
  usageCounterOf,
  usageCountersOf,
} from '../src/queries/metering';
import {
  cfdiGlobalsOfPeriod,
  cfdiPaymentOf,
  cfdiPaymentsOfPeriod,
  claimCfdiPayment,
  saveCfdiGlobal,
  updateCfdiPayment,
  type CfdiPaymentRow,
} from '../src/queries/cfdi';
import { integrationSuite } from './support/db';

/**
 * The tables of 0008 under the grants of 0009: `cfdi_*` belong to
 * `xangarro_billing`, `usage_*` to `xangarro_metering`, the tenant role sees
 * neither, and nobody deletes. Run as the real roles.
 */
const { url, describe } = integrationSuite();
const run = Date.now().toString(36);

function roleUrl(appUrl: string, role: string): string {
  const u = new URL(appUrl);
  u.username = role;
  u.password = role;
  return u.toString();
}

const payment = (id: string, over: Partial<CfdiPaymentRow> = {}): CfdiPaymentRow => ({
  externalPaymentId: id,
  businessId: 'biz',
  route: 'global',
  status: 'manual',
  totalCentavos: 34_800n,
  paidAt: '2026-09-17T12:00:00.000Z',
  period: '2099-01',
  formaPago: '04',
  description: 'Suscripción Xangarro',
  receptor: null,
  globalReasons: ['FISCAL_DATA_MISSING'],
  invoiceProviderId: null,
  invoiceUuid: null,
  complementProviderId: null,
  complementUuid: null,
  globalId: null,
  cancellation: null,
  creditNotes: null,
  ...over,
});

describe('metering and CFDI tables: one writer each, nobody deletes', () => {
  let app: Db;
  let billing: Db;
  let metering: Db;

  beforeAll(() => {
    app = createDb(url as string);
    billing = createDb(roleUrl(url as string, 'xangarro_billing'));
    metering = createDb(roleUrl(url as string, 'xangarro_metering'));
  });

  afterAll(async () => {
    for (const db of [app, billing, metering]) await db?.$client.end({ timeout: 5 });
  });

  it('billing claims a payment once, updates it and lists it by period', async () => {
    const row = payment(`in_${run}_a`);
    assert.equal(await claimCfdiPayment(billing, row), true);
    assert.equal(await claimCfdiPayment(billing, row), false);
    assert.equal(await updateCfdiPayment(billing, { ...row, status: 'pending_global' }), true);
    assert.equal(await updateCfdiPayment(billing, payment(`in_${run}_missing`)), false);
    const back = await cfdiPaymentOf(billing, row.externalPaymentId);
    assert.equal(back?.status, 'pending_global');
    assert.equal(back?.totalCentavos, 34_800n);
    assert.deepEqual(back?.globalReasons, ['FISCAL_DATA_MISSING']);
    const listed = await cfdiPaymentsOfPeriod(billing, row.period, ['pending_global']);
    assert.ok(listed.some((r) => r.externalPaymentId === row.externalPaymentId));
    assert.deepEqual(await cfdiPaymentsOfPeriod(billing, row.period, []), []);
  });

  it('billing keeps a payment’s credit notes (0040)', async () => {
    const row = payment(`in_${run}_notes`, { status: 'stamped' });
    assert.equal(await claimCfdiPayment(billing, row), true);
    assert.equal((await cfdiPaymentOf(billing, row.externalPaymentId))?.creditNotes, null);
    const notes = [{ refundId: 're_1', providerId: 'pac_1', uuid: 'U1', totalCentavos: '5000' }];
    assert.equal(await updateCfdiPayment(billing, { ...row, creditNotes: notes }), true);
    assert.deepEqual((await cfdiPaymentOf(billing, row.externalPaymentId))?.creditNotes, notes);
  });

  it('billing saves and replaces a global CFDI', async () => {
    const period = '2098-01';
    const draft = {
      id: `${period}#1-${run}`,
      period,
      sequence: 1,
      paymentIds: ['in_1'],
      status: 'stamping' as const,
      invoiceProviderId: null,
      invoiceUuid: null,
    };
    await saveCfdiGlobal(billing, draft);
    await saveCfdiGlobal(billing, { ...draft, status: 'stamped', invoiceUuid: 'U' });
    const globals = await cfdiGlobalsOfPeriod(billing, period);
    assert.deepEqual(
      globals.filter((g) => g.id === draft.id).map((g) => [g.status, g.invoiceUuid]),
      [['stamped', 'U']],
    );
  });

  it('metering upserts counters and claims each notice until delivered', async () => {
    const period = '2097-01';
    const biz = `biz-${run}`;
    const row = { businessId: biz, period, transactions: 1, activeProducts: 2 };
    await saveUsageCounters(metering, [row], '2026-09-18T09:00:00.000Z');
    await saveUsageCounters(metering, [{ ...row, transactions: 7 }], '2026-09-19T09:00:00.000Z');
    const stored = (await usageCountersOf(metering, [period])).filter((r) => r.businessId === biz);
    assert.deepEqual(stored, [{ ...row, transactions: 7 }]);
    const one = await usageCounterOf(metering, biz, period);
    assert.equal(one?.computedAt, '2026-09-19T09:00:00.000Z');
    assert.equal(await usageCounterOf(metering, biz, '2097-02'), null);

    const key = `${biz}:${period}:transactions:100`;
    assert.equal(await beginUsageNotice(metering, key, 'owner', biz), 'new');
    assert.equal(await beginUsageNotice(metering, key, 'owner', biz), 'retry');
    assert.equal(await beginUsageNotice(metering, key, 'provider', biz), 'new');
    await finishUsageNotice(metering, key, 'owner');
    assert.equal(await beginUsageNotice(metering, key, 'owner', biz), 'done');
  });

  it('keeps each writer out of the other tables and the tenant out of both', async () => {
    await assert.rejects(app.$client`SELECT 1 FROM cfdi_payments`, /permission denied/);
    await assert.rejects(app.$client`SELECT 1 FROM usage_counters`, /permission denied/);
    await assert.rejects(metering.$client`SELECT 1 FROM cfdi_payments`, /permission denied/);
    await assert.rejects(billing.$client`SELECT 1 FROM usage_notices`, /permission denied/);
    await assert.rejects(billing.$client`DELETE FROM cfdi_payments`, /permission denied/);
    await assert.rejects(metering.$client`DELETE FROM usage_notices`, /permission denied/);
  });
});
