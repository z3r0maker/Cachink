/**
 * CancelCfdiForRefundUseCase — a full refund cancels the payment's CFDI
 * (REP first, then the invoice) or drops it from the pending global CFDI.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import {
  CancelCfdiForRefundUseCase,
  CfdiProviderUnavailableError,
  CloseMonthlyGlobalCfdiUseCase,
  InMemoryIssuedCfdiRepository,
  IssueCfdiForPaymentUseCase,
} from '../../src/cfdi/index.js';
import { FakePacProvider } from './support/fake-pac-provider.js';
import { ISSUER, makePayment, makeTenantFiscal } from './support/fixtures.js';

describe('CancelCfdiForRefundUseCase', () => {
  let repo: InMemoryIssuedCfdiRepository;
  let pac: FakePacProvider;
  let issue: IssueCfdiForPaymentUseCase;
  let cancel: CancelCfdiForRefundUseCase;

  beforeEach(() => {
    repo = new InMemoryIssuedCfdiRepository();
    pac = new FakePacProvider();
    issue = new IssueCfdiForPaymentUseCase(repo, pac, ISSUER);
    cancel = new CancelCfdiForRefundUseCase(repo, pac);
  });

  const issueIndividual = (overrides: Parameters<typeof makePayment>[0] = {}) =>
    issue.execute({ payment: makePayment(overrides), tenantFiscal: makeTenantFiscal() });

  describe('happy paths', () => {
    it('cancels an individual PUE CFDI with motivo 03 by default', async () => {
      const { record } = await issueIndividual();
      const result = await cancel.execute({
        externalPaymentId: 'in_1QxYz',
        refundedCentavos: 19_900n,
      });
      assert.equal(result.outcome, 'cancelled');
      assert.deepEqual(pac.cancellations, [{ ...record.invoice!, motivo: '03' }]);
      const saved = await repo.findByPaymentId('in_1QxYz');
      assert.equal(saved?.status, 'cancelled');
      assert.deepEqual(saved?.cancellation, { motivo: '03', invoice: 'cancelled' });
    });

    it('cancels the REP before its PPD invoice, with the motivo given', async () => {
      const { record } = await issueIndividual({ method: 'spei', cardFunding: undefined });
      await cancel.execute({
        externalPaymentId: 'in_1QxYz',
        refundedCentavos: 19_900n,
        motivo: '02',
      });
      assert.deepEqual(
        pac.cancellations.map((c) => [c.uuid, c.motivo]),
        [
          [record.complement!.uuid, '02'],
          [record.invoice!.uuid, '02'],
        ],
      );
    });

    it('waits for receptor acceptance of the REP, then resumes on retry', async () => {
      const { record } = await issueIndividual({ method: 'spei', cardFunding: undefined });
      pac.cancelStatus.set(record.complement!.providerId, 'pending_acceptance');
      const first = await cancel.execute({
        externalPaymentId: 'in_1QxYz',
        refundedCentavos: 19_900n,
      });
      assert.equal(first.outcome, 'cancel_requested');
      assert.equal(pac.cancellations.length, 1); // the invoice waits for the REP

      pac.cancelStatus.set(record.complement!.providerId, 'cancelled');
      const second = await cancel.execute({
        externalPaymentId: 'in_1QxYz',
        refundedCentavos: 19_900n,
      });
      assert.equal(second.outcome, 'cancelled');
      assert.equal(pac.cancellations.length, 3);
    });

    it('drops a payment still waiting for the global CFDI, without calling the PAC', async () => {
      await issue.execute({ payment: makePayment(), tenantFiscal: null });
      const result = await cancel.execute({
        externalPaymentId: 'in_1QxYz',
        refundedCentavos: 19_900n,
      });
      assert.equal(result.outcome, 'removed_from_global');
      assert.equal((await repo.findByPaymentId('in_1QxYz'))?.status, 'excluded_from_global');
      assert.equal(pac.cancellations.length, 0);
    });

    it('is idempotent once cancelled', async () => {
      await issueIndividual();
      await cancel.execute({ externalPaymentId: 'in_1QxYz', refundedCentavos: 19_900n });
      const again = await cancel.execute({
        externalPaymentId: 'in_1QxYz',
        refundedCentavos: 19_900n,
      });
      assert.equal(again.alreadyProcessed, true);
      assert.equal(pac.cancellations.length, 1);
    });
  });

  describe('unhappy paths', () => {
    it('rejects an unknown payment', async () => {
      await assert.rejects(
        cancel.execute({ externalPaymentId: 'in_nope', refundedCentavos: 100n }),
        { code: 'CFDI_RECORD_NOT_FOUND' },
      );
    });

    it('rejects motivos 01 and 04 and a non-positive or excessive refund', async () => {
      await issueIndividual();
      const id = 'in_1QxYz';
      for (const motivo of ['01', '04'] as const) {
        await assert.rejects(
          cancel.execute({ externalPaymentId: id, refundedCentavos: 19_900n, motivo }),
          {
            code: 'CFDI_INVALID_CANCELLATION',
          },
        );
      }
      for (const refundedCentavos of [0n, 19_901n]) {
        await assert.rejects(cancel.execute({ externalPaymentId: id, refundedCentavos }), {
          code: 'CFDI_INVALID_CANCELLATION',
        });
      }
    });

    it('refuses a partial refund (needs a CFDI de egreso)', async () => {
      await issueIndividual();
      await assert.rejects(
        cancel.execute({ externalPaymentId: 'in_1QxYz', refundedCentavos: 9_950n }),
        { code: 'CFDI_PARTIAL_REFUND_NEEDS_CREDIT_NOTE' },
      );
      assert.equal(pac.cancellations.length, 0);
    });

    it('refuses a refund of a payment already inside a stamped global CFDI', async () => {
      await issue.execute({ payment: makePayment(), tenantFiscal: null });
      const close = new CloseMonthlyGlobalCfdiUseCase(
        repo,
        pac,
        ISSUER,
        () => new Date('2026-10-02'),
      );
      await close.execute({ period: '2026-09' });
      await assert.rejects(
        cancel.execute({ externalPaymentId: 'in_1QxYz', refundedCentavos: 19_900n }),
        { code: 'CFDI_GLOBAL_REFUND_NEEDS_CREDIT_NOTE' },
      );
    });

    it('refuses while the global CFDI containing the payment is being stamped', async () => {
      await issue.execute({ payment: makePayment(), tenantFiscal: null });
      const close = new CloseMonthlyGlobalCfdiUseCase(
        repo,
        pac,
        ISSUER,
        () => new Date('2026-10-02'),
      );
      pac.failNext('stampGlobalInvoice', new CfdiProviderUnavailableError('timeout'));
      await assert.rejects(close.execute({ period: '2026-09' }));
      await assert.rejects(
        cancel.execute({ externalPaymentId: 'in_1QxYz', refundedCentavos: 19_900n }),
        { code: 'CFDI_GLOBAL_IN_PROGRESS', retryable: true },
      );
    });

    it('refuses a payment whose CFDI is not stamped yet', async () => {
      pac.failNext('stampInvoice', new CfdiProviderUnavailableError('503'));
      await assert.rejects(issueIndividual());
      await assert.rejects(
        cancel.execute({ externalPaymentId: 'in_1QxYz', refundedCentavos: 19_900n }),
        { code: 'CFDI_NOT_STAMPED_YET', retryable: true },
      );
    });

    it('surfaces a SAT rejection of the cancellation', async () => {
      const { record } = await issueIndividual();
      pac.cancelStatus.set(record.invoice!.providerId, 'rejected');
      const result = await cancel.execute({
        externalPaymentId: 'in_1QxYz',
        refundedCentavos: 19_900n,
      });
      assert.equal(result.outcome, 'rejected');
      assert.equal(result.record.status, 'stamped');
    });
  });
});
