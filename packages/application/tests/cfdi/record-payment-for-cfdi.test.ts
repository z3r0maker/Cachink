import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  CfdiError,
  CfdiProviderUnavailableError,
  InMemoryIssuedCfdiRepository,
  IssueCfdiForPaymentUseCase,
  RecordPaymentForCfdiUseCase,
  type CfdiMode,
  type TenantFiscalSource,
} from '../../src/cfdi/index.js';
import {
  RecordingSupportInbox,
  SupportInboxError,
  type SupportInbox,
} from '../../src/support-inbox/index.js';
import { FakePacProvider } from './support/fake-pac-provider.js';
import { ISSUER, makePayment, makeTenantFiscal } from './support/fixtures.js';

const noFiscal: TenantFiscalSource = { fiscalOf: () => Promise.resolve(null) };
const withFiscal: TenantFiscalSource = { fiscalOf: () => Promise.resolve(makeTenantFiscal()) };

function harness(
  mode: CfdiMode,
  fiscal = noFiscal,
  inbox: SupportInbox = new RecordingSupportInbox(),
) {
  const repo = new InMemoryIssuedCfdiRepository();
  const pac = new FakePacProvider();
  const issue = mode === 'off' ? null : new IssueCfdiForPaymentUseCase(repo, pac, ISSUER);
  const useCase = new RecordPaymentForCfdiUseCase({ mode, repo, inbox, issue, fiscal });
  return { repo, pac, inbox, useCase };
}

describe('RecordPaymentForCfdiUseCase', () => {
  it('off: records the payment and files one "pago sin CFDI" item, calling no PAC', async () => {
    const h = harness('off');
    const result = await h.useCase.execute({ payment: makePayment() });
    assert.equal(result.outcome, 'manual');
    assert.equal((await h.repo.findByPaymentId('in_1QxYz'))?.status, 'manual');
    assert.equal(h.pac.stampedCount, 0);
    const items = (h.inbox as RecordingSupportInbox).items;
    assert.equal(items.length, 1);
    assert.equal(items[0]?.kind, 'factura');
    assert.equal(items[0]?.sourceRef, 'in_1QxYz');
    assert.equal(items[0]?.paymentRef, 'in_1QxYz');
    assert.equal(items[0]?.businessId, 'tenant-1');
    assert.match(items[0]?.body ?? '', /\$199\.00/);
    assert.match(items[0]?.body ?? '', /IVA incluido/);
  });

  it('off: a redelivered webhook records and files nothing new', async () => {
    const h = harness('off');
    await h.useCase.execute({ payment: makePayment() });
    const again = await h.useCase.execute({ payment: makePayment() });
    assert.equal(again.outcome, 'manual');
    assert.equal((await h.repo.listUninvoiced('2026-09')).length, 1);
    assert.equal((h.inbox as RecordingSupportInbox).items.length, 1);
  });

  it('test: stamps an individual CFDI and files nothing', async () => {
    const h = harness('test', withFiscal);
    const result = await h.useCase.execute({ payment: makePayment() });
    assert.equal(result.outcome, 'stamped');
    assert.equal(h.pac.stampedCount, 1);
    assert.equal((h.inbox as RecordingSupportInbox).items.length, 0);
  });

  it('test: a PAC failure files an urgent item and does not throw', async () => {
    const h = harness('test', withFiscal);
    h.pac.failNext('stampInvoice', new CfdiProviderUnavailableError('PAC caído'));
    const result = await h.useCase.execute({ payment: makePayment() });
    assert.equal(result.outcome, 'failed');
    const [item] = (h.inbox as RecordingSupportInbox).items;
    assert.equal(item?.urgent, true);
    assert.match(item?.body ?? '', /CFDI_PROVIDER_UNAVAILABLE/);
    assert.equal((await h.repo.findByPaymentId('in_1QxYz'))?.status, 'claimed');
  });

  it('a payment that cannot be invoiced (USD) is filed, not recorded', async () => {
    const h = harness('off');
    const result = await h.useCase.execute({ payment: makePayment({ currency: 'USD' }) });
    assert.equal(result.outcome, 'failed');
    assert.equal(result.record, null);
    assert.match(
      (h.inbox as RecordingSupportInbox).items[0]?.body ?? '',
      /CFDI_UNSUPPORTED_CURRENCY/,
    );
  });

  it('throws when the inbox is down, so Stripe retries — the record is kept', async () => {
    const down: SupportInbox = {
      file: () => Promise.reject(new SupportInboxError('INBOX_UNAVAILABLE', 'caída', true)),
    };
    const h = harness('off', noFiscal, down);
    await assert.rejects(h.useCase.execute({ payment: makePayment() }), SupportInboxError);
    assert.equal((await h.repo.findByPaymentId('in_1QxYz'))?.status, 'manual');
  });

  it('refuses test or live without an issuer', () => {
    const repo = new InMemoryIssuedCfdiRepository();
    const inbox = new RecordingSupportInbox();
    assert.throws(
      () =>
        new RecordPaymentForCfdiUseCase({
          mode: 'live',
          repo,
          inbox,
          issue: null,
          fiscal: noFiscal,
        }),
      (e: unknown) => e instanceof CfdiError && e.code === 'CFDI_PROVIDER_CONFIG',
    );
  });
});
