/**
 * CloseMonthlyGlobalCfdiUseCase — one "público en general" CFDI per month for
 * the payments that could not be invoiced individually.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import {
  CfdiProviderUnavailableError,
  CloseMonthlyGlobalCfdiUseCase,
  InMemoryIssuedCfdiRepository,
  IssueCfdiForPaymentUseCase,
} from '../../src/cfdi/index.js';
import { FakePacProvider } from './support/fake-pac-provider.js';
import { ISSUER, makePayment, makeTenantFiscal } from './support/fixtures.js';

const OCT_1_CDMX = new Date('2026-10-01T06:00:00Z');

describe('CloseMonthlyGlobalCfdiUseCase', () => {
  let repo: InMemoryIssuedCfdiRepository;
  let pac: FakePacProvider;
  let issue: IssueCfdiForPaymentUseCase;
  let now: Date;
  let close: CloseMonthlyGlobalCfdiUseCase;

  beforeEach(async () => {
    repo = new InMemoryIssuedCfdiRepository();
    pac = new FakePacProvider();
    issue = new IssueCfdiForPaymentUseCase(repo, pac, ISSUER);
    now = OCT_1_CDMX;
    close = new CloseMonthlyGlobalCfdiUseCase(repo, pac, ISSUER, () => now);
    const pay = (externalId: string, overrides: Parameters<typeof makePayment>[0] = {}) =>
      issue.execute({ payment: makePayment({ externalId, ...overrides }), tenantFiscal: null });
    await pay('in_a', { paidAt: new Date('2026-09-02T12:00:00Z') });
    await pay('in_b', {
      paidAt: new Date('2026-09-20T12:00:00Z'),
      method: 'spei',
      cardFunding: undefined,
      totalCentavos: 39_900n,
    });
    await pay('in_c', { paidAt: new Date('2026-09-10T12:00:00Z'), totalCentavos: 19_900n });
    await pay('in_oct', { paidAt: new Date('2026-10-01T07:00:00Z') });
    // An individually-invoiced payment never enters the global CFDI.
    await issue.execute({
      payment: makePayment({ externalId: 'in_individual' }),
      tenantFiscal: makeTenantFiscal(),
    });
  });

  it('stamps one global CFDI with one concepto per payment and marks them included', async () => {
    const result = await close.execute({ period: '2026-09' });
    assert.equal(result.outcome, 'stamped');
    assert.equal(pac.globals.length, 1);
    const request = pac.globals[0]!;
    assert.deepEqual(request.informacionGlobal, { periodicidad: '04', meses: '09', anio: 2026 });
    assert.equal(request.lugarExpedicion, '06600');
    assert.equal(request.idempotencyKey, 'cfdi:global:2026-09#1');
    // Card total 39,800 vs SPEI 39,900 → SPEI (03) is the predominant forma de pago.
    assert.equal(request.formaPago, '03');
    assert.deepEqual(
      request.conceptos.map((c) => [
        c.noIdentificacion,
        c.totalCentavos,
        c.claveProdServ,
        c.claveUnidad,
      ]),
      [
        ['in_a', 19_900n, '01010101', 'ACT'],
        ['in_c', 19_900n, '01010101', 'ACT'],
        ['in_b', 39_900n, '01010101', 'ACT'],
      ],
    );
    for (const id of ['in_a', 'in_b', 'in_c']) {
      const record = await repo.findByPaymentId(id);
      assert.equal(record?.status, 'in_global');
      assert.equal(record?.globalId, '2026-09#1');
    }
    assert.equal((await repo.findByPaymentId('in_oct'))?.status, 'pending_global');
    assert.equal(result.global?.status, 'stamped');
  });

  it('is idempotent: closing again with nothing new stamps nothing', async () => {
    await close.execute({ period: '2026-09' });
    const again = await close.execute({ period: '2026-09' });
    assert.equal(again.outcome, 'nothing_pending');
    assert.equal(pac.globals.length, 1);
  });

  it('a late payment in a closed month gets a second global CFDI', async () => {
    await close.execute({ period: '2026-09' });
    await issue.execute({
      payment: makePayment({ externalId: 'in_late', paidAt: new Date('2026-09-30T20:00:00Z') }),
      tenantFiscal: null,
    });
    const second = await close.execute({ period: '2026-09' });
    assert.equal(second.global?.id, '2026-09#2');
    assert.deepEqual(second.global?.paymentIds, ['in_late']);
  });

  it('a retry after a PAC failure stamps the same draft once', async () => {
    pac.failNext('stampGlobalInvoice', new CfdiProviderUnavailableError('timeout'));
    await assert.rejects(close.execute({ period: '2026-09' }), { retryable: true });
    const [draft] = await repo.listGlobals('2026-09');
    assert.equal(draft?.status, 'stamping');
    assert.equal((await repo.findByPaymentId('in_a'))?.status, 'pending_global');

    const retried = await close.execute({ period: '2026-09' });
    assert.equal(retried.global?.id, '2026-09#1');
    assert.equal(pac.stampedCount, 2); // the individual one + this global
    assert.equal((await repo.listGlobals('2026-09')).length, 1);
  });

  it('rejects closing a month that has not ended in CDMX', async () => {
    now = new Date('2026-10-01T05:59:59Z');
    await assert.rejects(close.execute({ period: '2026-09' }), { code: 'CFDI_PERIOD_NOT_CLOSED' });
    assert.equal(pac.globals.length, 0);
  });

  it('rejects a malformed period', async () => {
    await assert.rejects(close.execute({ period: '2026-9' }), { code: 'CFDI_INVALID_PERIOD' });
  });

  it('returns nothing_pending for a month without global payments', async () => {
    const result = await close.execute({ period: '2026-08' });
    assert.equal(result.outcome, 'nothing_pending');
    assert.equal(result.global, null);
    assert.equal(pac.globals.length, 0);
  });
});
