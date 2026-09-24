/**
 * RecordRefundForCfdiUseCase (N-33) — a Stripe refund moves the payment to a
 * refunded state (so the Facturas list shows `reembolso`, 0021) and files a
 * `factura` inbox item for the staff-driven SAT cancellation. No PAC call:
 * the automated cancellation waits for contador sign-off (O-14).
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';

import {
  InMemoryIssuedCfdiRepository,
  RecordRefundForCfdiUseCase,
  type IssuedCfdiRecord,
} from '../../src/cfdi/index.js';
import { RecordingSupportInbox } from '../../src/support-inbox/index.js';
import { makePayment } from './support/fixtures.js';

type Status = IssuedCfdiRecord['status'];

function record(status: Status, invoice?: IssuedCfdiRecord['invoice']): IssuedCfdiRecord {
  const payment = makePayment({ externalId: 'in_refund_1' });
  return {
    externalPaymentId: payment.externalId,
    tenantId: payment.tenantId,
    route: 'individual_pue',
    status,
    totalCentavos: payment.totalCentavos,
    paidAt: payment.paidAt,
    period: '2026-09',
    formaPago: '04',
    description: payment.description ?? '',
    ...(invoice !== undefined ? { invoice } : {}),
  };
}

describe('RecordRefundForCfdiUseCase', () => {
  let repo: InMemoryIssuedCfdiRepository;
  let inbox: RecordingSupportInbox;
  let useCase: RecordRefundForCfdiUseCase;

  beforeEach(() => {
    repo = new InMemoryIssuedCfdiRepository();
    inbox = new RecordingSupportInbox();
    useCase = new RecordRefundForCfdiUseCase({ repo, inbox });
  });

  const refund = {
    invoiceId: 'in_refund_1',
    businessId: 'B1',
    refundId: 're_1',
    amountRefundedCentavos: 23_084,
  };

  it('a stamped payment becomes cancel_requested and files the item', async () => {
    await repo.claim(
      record('stamped', { providerId: 'fp_1', uuid: '6f9619ff-8b86-d011-b42d-00c04fc964ff' }),
    );
    const result = await useCase.execute(refund);
    assert.equal(result.outcome, 'marked');
    assert.equal((await repo.findByPaymentId('in_refund_1'))?.status, 'cancel_requested');
    assert.equal(inbox.items.length, 1);
    assert.equal(inbox.items[0]?.kind, 'factura');
    assert.equal(inbox.items[0]?.sourceRef, 'refund:re_1');
    assert.match(inbox.items[0]?.body ?? '', /6f9619ff/);
  });

  it('a pending_global payment is excluded from the next global', async () => {
    await repo.claim(record('pending_global'));
    await useCase.execute(refund);
    assert.equal((await repo.findByPaymentId('in_refund_1'))?.status, 'excluded_from_global');
  });

  it('a partial refund keeps a pending_global payment in the global', async () => {
    await repo.claim(record('pending_global'));
    const result = await useCase.execute({ ...refund, amountRefundedCentavos: 5_000 });
    assert.equal(result.outcome, 'marked');
    assert.equal((await repo.findByPaymentId('in_refund_1'))?.status, 'pending_global');
    assert.match(inbox.items[0]?.body ?? '', /al timbrarlo, emitir un CFDI de egreso/);
  });

  it('a manual payment (nothing issued) is cancelled outright', async () => {
    await repo.claim(record('manual'));
    await useCase.execute(refund);
    assert.equal((await repo.findByPaymentId('in_refund_1'))?.status, 'cancelled');
  });

  it('an already-refunded payment is a no-op with no second item', async () => {
    await repo.claim(record('cancelled'));
    const result = await useCase.execute(refund);
    assert.equal(result.outcome, 'already_refunded');
    assert.equal(inbox.items.length, 0);
  });

  it('a refund for a payment we never recorded files nothing', async () => {
    const result = await useCase.execute({ ...refund, invoiceId: 'in_unknown' });
    assert.equal(result.outcome, 'unknown_payment');
    assert.equal(inbox.items.length, 0);
  });
});
