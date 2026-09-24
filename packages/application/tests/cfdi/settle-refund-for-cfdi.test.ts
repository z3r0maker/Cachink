/**
 * SettleRefundForCfdiUseCase (N-33) — a refund with `CFDI_MODE=test | live`:
 * cancel a full refund, credit a partial one, and hand everything else (and
 * every PAC failure) to the manual inbox path.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';

import {
  CancelCfdiForRefundUseCase,
  CfdiProviderUnavailableError,
  InMemoryIssuedCfdiRepository,
  IssueCreditNoteForRefundUseCase,
  RecordRefundForCfdiUseCase,
  SettleRefundForCfdiUseCase,
} from '../../src/cfdi/index.js';
import { RecordingSupportInbox } from '../../src/support-inbox/index.js';
import { FakePacProvider } from './support/fake-pac-provider.js';
import { ISSUER } from './support/fixtures.js';
import { INVOICE, globalStamped, refundRecord } from './support/refund-records.js';

describe('SettleRefundForCfdiUseCase', () => {
  let repo: InMemoryIssuedCfdiRepository;
  let pac: FakePacProvider;
  let inbox: RecordingSupportInbox;
  let useCase: SettleRefundForCfdiUseCase;
  const refund = (amount: number, refundId = 're_1') => ({
    invoiceId: 'in_refund_1',
    businessId: 'tenant-1',
    refundId,
    amountRefundedCentavos: amount,
  });
  const status = async () => (await repo.findByPaymentId('in_refund_1'))?.status;

  beforeEach(() => {
    repo = new InMemoryIssuedCfdiRepository();
    pac = new FakePacProvider();
    inbox = new RecordingSupportInbox();
    useCase = new SettleRefundForCfdiUseCase({
      repo,
      cancel: new CancelCfdiForRefundUseCase(repo, pac),
      credit: new IssueCreditNoteForRefundUseCase(repo, pac, ISSUER),
      manual: new RecordRefundForCfdiUseCase({ repo, inbox }),
    });
  });

  it('a full refund cancels the payment’s CFDI at the PAC, with no inbox item', async () => {
    await repo.claim(refundRecord('stamped'));
    const result = await useCase.execute(refund(19_900));
    assert.equal(result.outcome, 'cancelled');
    assert.equal(pac.cancellations[0]?.uuid, INVOICE.uuid);
    assert.equal(pac.cancellations[0]?.motivo, '03');
    assert.equal(await status(), 'cancelled');
    assert.equal(inbox.items.length, 0);
  });

  it('a full refund of a payment awaiting the global drops it from the global', async () => {
    await repo.claim(refundRecord('pending_global'));
    assert.equal((await useCase.execute(refund(19_900))).outcome, 'removed_from_global');
    assert.equal(await status(), 'excluded_from_global');
    assert.equal(pac.cancellations.length, 0);
  });

  it('a partial refund stamps a credit note and cancels nothing', async () => {
    await repo.claim(refundRecord('stamped'));
    assert.equal((await useCase.execute(refund(5_000))).outcome, 'credited');
    assert.equal(pac.creditNotes.length, 1);
    assert.equal(pac.cancellations.length, 0);
    assert.equal(await status(), 'stamped');
  });

  it('the rest of a partly credited payment is credited, not cancelled', async () => {
    await repo.claim(refundRecord('stamped'));
    await useCase.execute(refund(5_000));
    await useCase.execute(refund(19_900, 're_2'));
    assert.equal(pac.creditNotes[1]?.concepto.totalCentavos, 14_900n);
    assert.equal(pac.cancellations.length, 0);
  });

  it('a refund of a payment in a stamped global is credited', async () => {
    await repo.claim(refundRecord('in_global'));
    await repo.saveGlobal(globalStamped);
    assert.equal((await useCase.execute(refund(19_900))).outcome, 'credited');
  });

  it('a PAC failure falls back to the inbox, with the error on the item', async () => {
    await repo.claim(refundRecord('stamped'));
    pac.failNext('stampCreditNote', new CfdiProviderUnavailableError('Facturapi 503'));
    const result = await useCase.execute(refund(5_000));
    assert.equal(result.outcome, 'manual');
    assert.equal(inbox.items.length, 1);
    assert.equal(inbox.items[0]?.urgent, true);
    assert.match(inbox.items[0]?.body ?? '', /CFDI_PROVIDER_UNAVAILABLE — Facturapi 503/);
  });

  it('a cancellation the SAT rejects goes to the inbox', async () => {
    await repo.claim(refundRecord('stamped'));
    pac.cancelStatus.set(INVOICE.providerId, 'rejected');
    assert.equal((await useCase.execute(refund(19_900))).outcome, 'manual');
    assert.match(inbox.items[0]?.body ?? '', /rechazó la cancelación/);
  });

  it('a partial refund of a payment awaiting the global keeps it in the global', async () => {
    await repo.claim(refundRecord('pending_global'));
    assert.equal((await useCase.execute(refund(5_000))).outcome, 'manual');
    assert.equal(await status(), 'pending_global');
    assert.match(inbox.items[0]?.body ?? '', /sigue en el CFDI global/);
  });

  it('an unknown payment and an already cancelled one do nothing', async () => {
    assert.equal((await useCase.execute(refund(19_900))).outcome, 'unknown_payment');
    await repo.claim(refundRecord('cancelled'));
    assert.equal((await useCase.execute(refund(19_900))).outcome, 'already_refunded');
    assert.equal(inbox.items.length, 0);
    assert.equal(pac.cancellations.length, 0);
  });
});
