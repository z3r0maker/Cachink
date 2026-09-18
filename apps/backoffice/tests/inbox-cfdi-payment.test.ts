import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { markPaymentInvoiced, type MarkCfdiIssued } from '@/server/inbox/cfdi-payment';
import { changeSupportItemStatus } from '@/server/inbox/status';

import { BUSINESS, CFDI, item, NOW, seeded } from './support/inbox';

/** Resolving a "pago sin CFDI" with its UUID marks the payment (N-33, 0019). */
const clock = { now: () => NOW };
const factura = item({
  kind: 'factura',
  businessId: BUSINESS,
  paymentRef: 'in_1',
  sourceRef: 'in_1',
  source: 'stripe-webhook',
});

function recorder(answer = true) {
  const calls: Parameters<MarkCfdiIssued>[0][] = [];
  const mark: MarkCfdiIssued = (input) => {
    calls.push(input);
    return Promise.resolve(answer);
  };
  return { calls, mark };
}

async function resolve(it0 = factura, status = 'resuelto') {
  return changeSupportItemStatus(seeded(it0), { id: it0.id, status, cfdiUuid: CFDI }, clock);
}

describe('markPaymentInvoiced', () => {
  it('a resolved factura item marks its payment with the folio fiscal', async () => {
    const r = recorder();
    assert.equal(await markPaymentInvoiced(r.mark, await resolve()), 'marked');
    assert.deepEqual(r.calls, [{ paymentId: 'in_1', businessId: BUSINESS, uuid: CFDI }]);
  });

  it('a payment already invoiced (or unknown) reads as already', async () => {
    const r = recorder(false);
    assert.equal(await markPaymentInvoiced(r.mark, await resolve()), 'already');
  });

  it('marks nothing for an item not resolved, not a factura, or the monthly close', async () => {
    const r = recorder();
    assert.equal(
      await markPaymentInvoiced(r.mark, await resolve(factura, 'en_curso')),
      'not_applicable',
    );
    const bug = item();
    const bugResolved = await changeSupportItemStatus(
      seeded(bug),
      { id: bug.id, status: 'resuelto' },
      clock,
    );
    assert.equal(await markPaymentInvoiced(r.mark, bugResolved), 'not_applicable');
    const close = item({ ...factura, businessId: null, paymentRef: 'cfdi-global:2026-09' });
    assert.equal(await markPaymentInvoiced(r.mark, await resolve(close)), 'not_applicable');
    assert.equal(r.calls.length, 0);
  });

  it('a failure to mark propagates, so the status change rolls back with it', async () => {
    const failing: MarkCfdiIssued = () => Promise.reject(new Error('permission denied'));
    await assert.rejects(markPaymentInvoiced(failing, await resolve()), /permission denied/);
  });
});
