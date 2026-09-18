import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  CfdiError,
  CfdiProviderUnavailableError,
  CloseCfdiPeriodUseCase,
  CloseMonthlyGlobalCfdiUseCase,
  InMemoryIssuedCfdiRepository,
  previousFiscalPeriodOf,
  RecordPaymentForCfdiUseCase,
  IssueCfdiForPaymentUseCase,
  type CfdiMode,
} from '../../src/cfdi/index.js';
import { RecordingSupportInbox } from '../../src/support-inbox/index.js';
import { FakePacProvider } from './support/fake-pac-provider.js';
import { ISSUER, makePayment } from './support/fixtures.js';

/** 1 Oct 2026, 01:00 in CDMX — the cron's first run after September closes. */
const OCT_1 = new Date('2026-10-01T07:00:00Z');

async function harness(mode: CfdiMode, payments = 2) {
  const repo = new InMemoryIssuedCfdiRepository();
  const pac = new FakePacProvider();
  const inbox = new RecordingSupportInbox();
  const issue = mode === 'off' ? null : new IssueCfdiForPaymentUseCase(repo, pac, ISSUER);
  const fiscal = { fiscalOf: () => Promise.resolve(null) };
  const record = new RecordPaymentForCfdiUseCase({ mode, repo, inbox, issue, fiscal });
  for (let i = 0; i < payments; i += 1) {
    await record.execute({ payment: makePayment({ externalId: `in_${i}`, tenantId: `t${i}` }) });
  }
  const close =
    mode === 'off' ? null : new CloseMonthlyGlobalCfdiUseCase(repo, pac, ISSUER, () => OCT_1);
  const useCase = new CloseCfdiPeriodUseCase({ mode, repo, inbox, close, now: () => OCT_1 });
  return { repo, pac, inbox, useCase };
}

describe('CloseCfdiPeriodUseCase', () => {
  it('defaults to the month that just closed', () => {
    assert.equal(previousFiscalPeriodOf(OCT_1), '2026-09');
    assert.equal(previousFiscalPeriodOf(new Date('2026-01-01T07:00:00Z')), '2025-12');
  });

  it('off: lists every un-invoiced payment of the period in one item, stamps nothing', async () => {
    const h = await harness('off');
    const before = h.inbox.items.length;
    const result = await h.useCase.execute({});
    assert.deepEqual(result, { period: '2026-09', outcome: 'listed', payments: 2 });
    const item = h.inbox.items[before];
    assert.equal(item?.sourceRef, 'cfdi-global:2026-09');
    assert.match(item?.body ?? '', /in_0/);
    assert.match(item?.body ?? '', /in_1/);
    assert.match(item?.title ?? '', /2 pagos sin CFDI · \$398\.00/);
    assert.equal(h.pac.stampedCount, 0);
  });

  it('off: files nothing when the period owes no CFDI', async () => {
    const h = await harness('off', 0);
    const result = await h.useCase.execute({});
    assert.equal(result.outcome, 'nothing_pending');
    assert.equal(h.inbox.items.length, 0);
  });

  it('test: stamps the global CFDI and files nothing', async () => {
    const h = await harness('test');
    const result = await h.useCase.execute({});
    assert.equal(result.outcome, 'stamped');
    assert.equal(h.pac.globals.length, 1);
    assert.equal(h.inbox.items.length, 0);
  });

  it('test: a PAC failure files one urgent item instead of throwing', async () => {
    const h = await harness('test');
    h.pac.failNext('stampGlobalInvoice', new CfdiProviderUnavailableError('PAC caído'));
    const result = await h.useCase.execute({});
    assert.equal(result.outcome, 'failed');
    assert.equal(h.inbox.items[0]?.sourceRef, 'cfdi-global-error:2026-09');
    assert.equal(h.inbox.items[0]?.urgent, true);
  });

  it('refuses an open or malformed period', async () => {
    const h = await harness('off', 0);
    const code = (e: unknown) => (e instanceof CfdiError ? e.code : null);
    await assert.rejects(
      h.useCase.execute({ period: '2026-10' }),
      (e) => code(e) === 'CFDI_PERIOD_NOT_CLOSED',
    );
    await assert.rejects(
      h.useCase.execute({ period: '2026-13' }),
      (e) => code(e) === 'CFDI_INVALID_PERIOD',
    );
  });

  it('refuses test or live without the close use case', () => {
    const repo = new InMemoryIssuedCfdiRepository();
    const inbox = new RecordingSupportInbox();
    assert.throws(
      () =>
        new CloseCfdiPeriodUseCase({ mode: 'test', repo, inbox, close: null, now: () => OCT_1 }),
      CfdiError,
    );
  });
});
