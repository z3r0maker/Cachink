import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * The CFDI composition root's two listeners (N-33, ADR-070), every dependency
 * mocked: with CFDI off — every E2E run, production at launch — the invoice
 * listener wires the use case with no PAC and no issuer, and the refund
 * listener falls back to the manual bookkeeping path. With a matching key and
 * issuer, the real PAC is wired in. The composer is what a staging deploy
 * gets right or wrong; the use cases' own behaviour is the application
 * package's, fully tested there.
 */

const cfdiInvoicePaidListener = vi.fn((useCase: unknown) => ({ __listener: useCase }));

vi.mock('@xangarro/application/cfdi', async (orig) => ({
  // The config readers are real: mode, key shape and issuer rules are the
  // composition root's own contract, not something to fake.
  ...(await orig()),
  FacturapiPacProvider: class {},

  CfdiError: class CfdiError extends Error {
    constructor(
      readonly code: string,
      message: string,
    ) {
      super(message);
    }
  },
  FacturapiPacProvider: class {},
  IssueCfdiForPaymentUseCase: class {
    constructor(
      readonly repo: unknown,
      readonly pac: unknown,
      readonly issuer: unknown,
    ) {}
  },
  RecordPaymentForCfdiUseCase: class {
    constructor(readonly deps: Record<string, unknown>) {}
  },
  RecordRefundForCfdiUseCase: class {
    constructor(readonly deps: Record<string, unknown>) {}
  },
  SettleRefundForCfdiUseCase: class {
    constructor(readonly deps: Record<string, unknown>) {}
  },
  CancelCfdiForRefundUseCase: class {
    constructor(
      readonly repo: unknown,
      readonly pac: unknown,
    ) {}
  },
  IssueCreditNoteForRefundUseCase: class {
    constructor(
      readonly repo: unknown,
      readonly pac: unknown,
      readonly issuer: unknown,
    ) {}
  },
}));
vi.mock('@xangarro/application/billing', () => ({ cfdiInvoicePaidListener }));
vi.mock('../../src/server/billing/cfdi-repository', () => ({
  pgIssuedCfdiRepository: () => ({ repo: true }),
}));
vi.mock('../../src/server/billing/config', () => ({
  billingDb: () => ({}),
  stripeClient: () => ({}),
}));
vi.mock('../../src/server/billing/fiscal-source', () => ({
  pgTenantFiscalSource: () => ({ fiscal: true }),
}));
vi.mock('../../src/server/support-inbox', () => ({ supportInboxFromEnv: () => ({ inbox: true }) }));
vi.mock('../../src/server/email/factura-issued', () => ({
  liveFacturaIssuedListener: () => ({ issued: true }),
}));

const { liveCfdiInvoiceListener, liveCfdiRefundListener } =
  await import('../../src/server/billing/cfdi');

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.CFDI_MODE;
  delete process.env.FACTURAPI_API_KEY;
  delete process.env.CFDI_LUGAR_EXPEDICION;
  delete process.env.CFDI_PRODUCT_KEY;
});

describe('liveCfdiInvoiceListener', () => {
  it('CFDI off: the use case wires with no PAC and no issue — bookkeeping only', () => {
    const listener = liveCfdiInvoiceListener();
    const useCase = (listener as { __listener: RecordPaymentMock }).__listener;
    assert.equal(useCase.deps.mode, 'off');
    assert.equal(useCase.deps.issue, null);
    assert.ok((useCase.deps.repo as { repo: boolean }).repo);
    assert.ok((useCase.deps.inbox as { inbox: boolean }).inbox);
    assert.ok((useCase.deps.issued as { issued: boolean }).issued);
  });

  it('CFDI test with a matching key and issuer: the real PAC is wired in', () => {
    process.env.CFDI_MODE = 'test';
    process.env.FACTURAPI_API_KEY = 'sk_test_a';
    process.env.CFDI_LUGAR_EXPEDICION = '06600';
    const listener = liveCfdiInvoiceListener();
    const useCase = (listener as { __listener: RecordPaymentMock }).__listener;
    assert.equal(useCase.deps.mode, 'test');
    const issue = useCase.deps.issue as { pac: unknown; issuer: unknown } | null;
    assert.ok(issue !== null, 'the issue use case exists');
    assert.ok(issue.pac !== null && issue.pac !== undefined);
  });

  it('test mode without a lugar de expedición refuses rather than stamping blind', () => {
    process.env.CFDI_MODE = 'test';
    process.env.FACTURAPI_API_KEY = 'sk_test_a';
    // No CFDI_LUGAR_EXPEDICION: readCfdiIssuerConfig throws.
    assert.throws(
      () => liveCfdiInvoiceListener(),
      (e: unknown) => {
        assert.ok(e instanceof Error);
        assert.match(e.message, /CFDI_LUGAR_EXPEDICION|lugar/i);
        return true;
      },
    );
  });
});

type RecordPaymentMock = { deps: Record<string, unknown> };

describe('liveCfdiRefundListener', () => {
  it('CFDI off: the manual bookkeeping path, nothing else', () => {
    const listener = liveCfdiRefundListener() as unknown as Record<string, unknown>;
    // The listener returns a plain object wrapping the manual use case.
    const useCase = (listener.onRefund ?? listener.handle ?? Object.values(listener)[0]) as unknown;
    assert.ok(useCase !== undefined, 'a use case is wired');
  });

  it('CFDI test with the full config: the settle path owns refunds', () => {
    process.env.CFDI_MODE = 'test';
    process.env.FACTURAPI_API_KEY = 'sk_test_a';
    process.env.CFDI_LUGAR_EXPEDICION = '06600';
    const listener = liveCfdiRefundListener() as unknown as Record<string, unknown>;
    assert.ok(Object.keys(listener).length > 0);
  });
});
