import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  cfdiInvoicePaidListener,
  paymentFromInvoice,
  type PaidInvoice,
} from '../src/billing/index.js';
import { InMemoryIssuedCfdiRepository, RecordPaymentForCfdiUseCase } from '../src/cfdi/index.js';
import { RecordingSupportInbox, SupportInboxError } from '../src/support-inbox/index.js';

const INVOICE: PaidInvoice = {
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7AAA',
  stripeInvoiceId: 'in_abc',
  stripeSubscriptionId: 'sub_1',
  subtotalCentavos: 30_000,
  taxCentavos: 4_800,
  totalCentavos: 34_800,
  currency: 'mxn',
  paidAt: '2026-09-17T12:00:00.000Z',
  collectionMethod: 'charge_automatically',
};

function wired(inbox = new RecordingSupportInbox()) {
  const repo = new InMemoryIssuedCfdiRepository();
  const fiscal = { fiscalOf: () => Promise.resolve(null) };
  const useCase = new RecordPaymentForCfdiUseCase({
    mode: 'off',
    repo,
    inbox,
    issue: null,
    fiscal,
  });
  return { repo, inbox, listener: cfdiInvoicePaidListener(useCase) };
}

describe('cfdiInvoicePaidListener (invoice.paid → CFDI)', () => {
  it('records a paid card invoice and files it as a pago sin CFDI', async () => {
    const w = wired();
    await w.listener.onInvoicePaid(INVOICE);
    const record = await w.repo.findByPaymentId('in_abc');
    assert.equal(record?.totalCentavos, 34_800n);
    assert.equal(record?.formaPago, '04');
    assert.equal(w.inbox.items[0]?.businessId, INVOICE.businessId);
  });

  it('maps a send_invoice subscription to SPEI and keeps centavos exact', () => {
    const p = paymentFromInvoice({
      ...INVOICE,
      collectionMethod: 'send_invoice',
      totalCentavos: 1,
    });
    assert.equal(p.method, 'spei');
    assert.equal(p.totalCentavos, 1n);
  });

  it('files, not records, an invoice with an unreadable payment date', async () => {
    const w = wired();
    await w.listener.onInvoicePaid({ ...INVOICE, paidAt: 'never' });
    assert.equal(await w.repo.findByPaymentId('in_abc'), null);
    assert.equal(w.inbox.items[0]?.urgent, true);
  });

  it('lets an inbox failure reach the webhook, so Stripe retries', async () => {
    const down = {
      file: () => Promise.reject(new SupportInboxError('INBOX_UNAVAILABLE', 'caída', true)),
    };
    const repo = new InMemoryIssuedCfdiRepository();
    const fiscal = { fiscalOf: () => Promise.resolve(null) };
    const useCase = new RecordPaymentForCfdiUseCase({
      mode: 'off',
      repo,
      inbox: down,
      issue: null,
      fiscal,
    });
    await assert.rejects(
      cfdiInvoicePaidListener(useCase).onInvoicePaid(INVOICE),
      SupportInboxError,
    );
  });
});
