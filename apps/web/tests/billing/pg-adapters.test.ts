import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';
import { CfdiError, UNINVOICED_STATUSES, type IssuedCfdiRecord } from '@xangarro/application/cfdi';

/**
 * The billing and CFDI repositories over Postgres, at their seam with
 * `@xangarro/data-pg` (whose queries have their own integration tests). What
 * can break here is the wiring: an argument in the wrong place, a missing row
 * that should be `null` or an error, the wrong statuses asked for.
 */

const q = {
  billingCustomerOf: vi.fn(),
  saveBillingCustomer: vi.fn(),
  businessOfBillingCustomer: vi.fn(),
  subscriptionsOfBusiness: vi.fn(),
  saveSubscriptionRow: vi.fn(),
  beginStripeEvent: vi.fn(),
  finishStripeEvent: vi.fn(),
  failStripeEvent: vi.fn(),
  cfdiPaymentOf: vi.fn(),
  claimCfdiPayment: vi.fn(),
  updateCfdiPayment: vi.fn(),
  cfdiPaymentsOfPeriod: vi.fn(),
  cfdiGlobalsOfPeriod: vi.fn(),
  saveCfdiGlobal: vi.fn(),
};
vi.mock('@xangarro/data-pg', () => q);

const { pgBillingRepository, pgStripeEventLedger } =
  await import('../../src/server/billing/repository');
const { pgIssuedCfdiRepository, toRow } = await import('../../src/server/billing/cfdi-repository');

const DB = { name: 'billing' } as never;

const RECORD: IssuedCfdiRecord = {
  externalPaymentId: 'in_1',
  tenantId: '01HZ8XQN9GZJXV8AKQ5X0C7AAA',
  route: 'global',
  status: 'manual',
  totalCentavos: 34_800n,
  paidAt: new Date('2026-09-17T12:00:00.000Z'),
  period: '2026-09',
  formaPago: '04',
  description: 'Suscripción Xangarro',
  globalReasons: ['rfc_missing'],
};

beforeEach(() => vi.clearAllMocks());

describe('pgBillingRepository and pgStripeEventLedger', () => {
  it('hands every call to its query, on the billing connection, in order', async () => {
    const repo = pgBillingRepository(DB);
    await repo.customerOf('biz-1');
    await repo.saveCustomer('biz-1', 'cus_1');
    await repo.businessOfCustomer('cus_1');
    await repo.subscriptionsOf('biz-1');
    await repo.saveSubscription({ stripeSubscriptionId: 'sub_1' } as never);
    const ledger = pgStripeEventLedger(DB);
    await ledger.begin('evt_1', 'invoice.paid');
    await ledger.finish('evt_1', 'applied');
    await ledger.fail('evt_1', 'boom');

    assert.deepEqual(q.billingCustomerOf.mock.calls, [[DB, 'biz-1']]);
    assert.deepEqual(q.saveBillingCustomer.mock.calls, [[DB, 'biz-1', 'cus_1']]);
    assert.deepEqual(q.businessOfBillingCustomer.mock.calls, [[DB, 'cus_1']]);
    assert.deepEqual(q.subscriptionsOfBusiness.mock.calls, [[DB, 'biz-1']]);
    assert.deepEqual(q.saveSubscriptionRow.mock.calls, [[DB, { stripeSubscriptionId: 'sub_1' }]]);
    assert.deepEqual(q.beginStripeEvent.mock.calls, [[DB, 'evt_1', 'invoice.paid']]);
    assert.deepEqual(q.finishStripeEvent.mock.calls, [[DB, 'evt_1', 'applied']]);
    assert.deepEqual(q.failStripeEvent.mock.calls, [[DB, 'evt_1', 'boom']]);
  });
});

describe('pgIssuedCfdiRepository', () => {
  it('finds a payment by id as a record, and a missing one as null', async () => {
    q.cfdiPaymentOf.mockResolvedValueOnce(toRow(RECORD)).mockResolvedValueOnce(null);
    const repo = pgIssuedCfdiRepository(DB);
    assert.deepEqual(await repo.findByPaymentId('in_1'), RECORD);
    assert.equal(await repo.findByPaymentId('in_missing'), null);
  });

  it('claims a payment as its row', async () => {
    const repo = pgIssuedCfdiRepository(DB);
    await repo.claim(RECORD);
    assert.deepEqual(q.claimCfdiPayment.mock.calls, [[DB, toRow(RECORD)]]);
  });

  it('an update that matched no row is CFDI_RECORD_NOT_FOUND, not a silent no-op', async () => {
    q.updateCfdiPayment.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const repo = pgIssuedCfdiRepository(DB);
    await repo.update(RECORD);
    const err = await repo.update(RECORD).catch((e: unknown) => e);
    assert.ok(err instanceof CfdiError);
    assert.equal(err.code, 'CFDI_RECORD_NOT_FOUND');
    assert.match(err.message, /in_1/);
  });

  it('the period lists ask for exactly their statuses', async () => {
    q.cfdiPaymentsOfPeriod.mockResolvedValue([toRow(RECORD)]);
    q.cfdiGlobalsOfPeriod.mockResolvedValue([]);
    const repo = pgIssuedCfdiRepository(DB);
    assert.deepEqual(await repo.listPendingGlobal('2026-09'), [RECORD]);
    assert.deepEqual(await repo.listUninvoiced('2026-09'), [RECORD]);
    assert.deepEqual(await repo.listGlobals('2026-09'), []);
    assert.deepEqual(q.cfdiPaymentsOfPeriod.mock.calls, [
      [DB, '2026-09', ['pending_global']],
      [DB, '2026-09', UNINVOICED_STATUSES],
    ]);
  });
});
