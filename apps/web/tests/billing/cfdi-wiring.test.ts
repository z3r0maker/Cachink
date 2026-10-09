import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { InMemoryIssuedCfdiRepository } from '@xangarro/application/cfdi';
import type { InboxItemRequest } from '@xangarro/application/support-inbox';
import type { PaidInvoice } from '@xangarro/application/billing';

import {
  liveCfdiInvoiceListener,
  liveCfdiRefundListener,
  liveCloseCfdiPeriod,
} from '../../src/server/billing/cfdi';
import { BIZ } from './support';

/**
 * The CFDI composition root (N-33) wired end to end with its IO swapped for
 * memory: the Postgres repository, the Stripe client, the admin inbox. Every
 * E2E run has `CFDI_MODE` off and no Stripe refunds, so the refund listener's
 * charge → invoice lookup and the monthly close only ever run here.
 */

const io = vi.hoisted(() => ({
  repo: null as unknown,
  filed: [] as unknown[],
  charge: null as null | { payment_intent: unknown },
  invoice: null as unknown,
  stripeDown: false,
}));

vi.mock('../../src/server/billing/config', () => ({
  billingDb: () => ({}),
  stripeClient: () => ({
    charges: {
      retrieve: async () => {
        if (io.stripeDown) throw new Error('stripe unavailable');
        return io.charge;
      },
    },
    invoicePayments: {
      list: async () => ({ data: io.invoice === null ? [] : [{ invoice: io.invoice }] }),
    },
  }),
}));
vi.mock('../../src/server/billing/cfdi-repository', () => ({
  pgIssuedCfdiRepository: () => io.repo,
}));
vi.mock('../../src/server/billing/fiscal-source', () => ({
  pgTenantFiscalSource: () => ({ fiscalOf: async () => null }),
}));
vi.mock('../../src/server/support-inbox', () => ({
  supportInboxFromEnv: () => ({
    file: async (item: InboxItemRequest) => void io.filed.push(item),
  }),
}));
vi.mock('../../src/server/email/factura-issued', () => ({
  liveFacturaIssuedListener: () => ({ onIssued: async () => undefined }),
}));

const repo = () => io.repo as InMemoryIssuedCfdiRepository;

const paid: PaidInvoice = {
  businessId: BIZ,
  stripeInvoiceId: 'in_cfdi_1',
  stripeSubscriptionId: 'sub_1',
  subtotalCentavos: 25_862,
  taxCentavos: 4_138,
  totalCentavos: 30_000,
  currency: 'mxn',
  paidAt: '2026-08-10T18:00:00.000Z',
  collectionMethod: 'charge_automatically',
};

const refund = (amountRefundedCentavos = 30_000) => ({
  businessId: BIZ,
  customerId: 'cus_1',
  chargeId: 'ch_1',
  refundId: 're_1',
  amountRefundedCentavos,
});

beforeEach(() => {
  io.repo = new InMemoryIssuedCfdiRepository();
  io.filed = [];
  io.charge = { payment_intent: 'pi_1' };
  io.invoice = 'in_cfdi_1';
  io.stripeDown = false;
  vi.stubEnv('CFDI_MODE', 'off');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('liveCfdiInvoiceListener (CFDI_MODE=off)', () => {
  it('records the paid invoice for a manual CFDI and files it for staff', async () => {
    await liveCfdiInvoiceListener().onInvoicePaid(paid);
    const record = await repo().findByPaymentId('in_cfdi_1');
    assert.equal(record?.status, 'manual');
    assert.equal(record?.totalCentavos, 30_000n);
    assert.equal(io.filed.length, 1);
  });

  it('files a payment it cannot validate instead of recording it', async () => {
    await liveCfdiInvoiceListener().onInvoicePaid({ ...paid, currency: 'usd' });
    assert.equal(await repo().findByPaymentId('in_cfdi_1'), null);
    assert.equal(io.filed.length, 1);
  });
});

describe('liveCfdiRefundListener (CFDI_MODE=off)', () => {
  it('follows charge → payment intent → invoice and marks a full refund', async () => {
    await liveCfdiInvoiceListener().onInvoicePaid(paid);
    const done = await liveCfdiRefundListener().onChargeRefunded(refund());
    assert.deepEqual(done, { outcome: 'applied', businessId: BIZ, refund: 'recorded' });
    assert.equal((await repo().findByPaymentId('in_cfdi_1'))?.status, 'cancelled');
    assert.equal(io.filed.length, 2);
  });

  it('reads the invoice id off an expanded invoice object too', async () => {
    await liveCfdiInvoiceListener().onInvoicePaid(paid);
    io.invoice = { id: 'in_cfdi_1' };
    const done = await liveCfdiRefundListener().onChargeRefunded(refund());
    assert.equal(done.refund, 'recorded');
  });

  it('answers «already_refunded» the second time the same refund arrives', async () => {
    await liveCfdiInvoiceListener().onInvoicePaid(paid);
    await liveCfdiRefundListener().onChargeRefunded(refund());
    const again = await liveCfdiRefundListener().onChargeRefunded(refund());
    assert.equal(again.refund, 'already_refunded');
  });

  it('is «unresolved» when the charge names no payment intent', async () => {
    io.charge = { payment_intent: null };
    const done = await liveCfdiRefundListener().onChargeRefunded(refund());
    assert.deepEqual(done, { outcome: 'applied', businessId: BIZ, refund: 'unresolved' });
    assert.equal(io.filed.length, 0);
  });

  it('is «unresolved» when no invoice payment indexes the intent', async () => {
    io.invoice = null;
    const done = await liveCfdiRefundListener().onChargeRefunded(refund());
    assert.equal(done.refund, 'unresolved');
  });

  it('passes «unknown_payment» through for an invoice it never recorded', async () => {
    const done = await liveCfdiRefundListener().onChargeRefunded(refund());
    assert.equal(done.refund, 'unknown_payment');
  });

  it('throws when Stripe fails, so the webhook 500s and Stripe retries', async () => {
    io.stripeDown = true;
    await assert.rejects(liveCfdiRefundListener().onChargeRefunded(refund()), /stripe unavailable/);
  });
});

describe('liveCloseCfdiPeriod (CFDI_MODE=off)', () => {
  const september = () => new Date('2026-09-01T07:00:00.000Z');

  it('lists the closed month’s payments still owed a CFDI in one inbox item', async () => {
    await liveCfdiInvoiceListener().onInvoicePaid(paid);
    io.filed = [];
    const result = await liveCloseCfdiPeriod(september).execute({});
    assert.deepEqual(result, { period: '2026-08', outcome: 'listed', payments: 1 });
    assert.equal(io.filed.length, 1);
  });

  it('answers «nothing_pending» for a month without payments', async () => {
    const result = await liveCloseCfdiPeriod(september).execute({});
    assert.deepEqual(result, { period: '2026-08', outcome: 'nothing_pending' });
    assert.equal(io.filed.length, 0);
  });

  it('refuses to close a month that has not ended', async () => {
    await assert.rejects(liveCloseCfdiPeriod(september).execute({ period: '2026-09' }), {
      code: 'CFDI_PERIOD_NOT_CLOSED',
    });
  });
});

describe('the composition root with a PAC (CFDI_MODE=test)', () => {
  beforeEach(() => {
    vi.stubEnv('CFDI_MODE', 'test');
    vi.stubEnv('FACTURAPI_API_KEY', 'sk_test_ci-only-not-a-real-secret');
    vi.stubEnv('CFDI_LUGAR_EXPEDICION', '06600');
  });

  it('settles a refund of an unknown payment without calling the PAC', async () => {
    const done = await liveCfdiRefundListener().onChargeRefunded(refund());
    assert.equal(done.refund, 'unknown_payment');
  });

  it('builds the close with the monthly global CFDI', () => {
    assert.ok(liveCloseCfdiPeriod());
    assert.ok(liveCfdiInvoiceListener());
  });

  it('refuses a PAC configuration without a lugar de expedición', () => {
    vi.stubEnv('CFDI_LUGAR_EXPEDICION', '');
    assert.throws(() => liveCloseCfdiPeriod(), { code: 'CFDI_PROVIDER_CONFIG' });
  });
});
