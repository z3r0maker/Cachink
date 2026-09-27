import assert from 'node:assert/strict';
import { beforeAll, beforeEach, describe, it, vi, type MockedFunction } from 'vitest';

import type * as billingActions from '../../src/server/billing/actions';
import type { recordGeo } from '../../src/server/geo/record';
import type { reportError } from '../../src/server/observability/report';

/**
 * The billing server functions the Suscripción screen calls (P-10).
 *
 * Two of their claims are worth more than the coverage they earn. **The beta
 * does not charge** (P-36 D-1, owner decision 2026-09-25): while
 * `BILLING_BETA_NO_CHARGE` is on, no Checkout may open — and a guard that is
 * only a first line in two functions is exactly the kind that survives a
 * refactor in name while losing its effect. And **an unexpected failure must
 * not reach the shopkeeper**: a `BillingError` carries a message written for
 * them, anything else is reported and answered with one sentence, because a
 * Stripe stack trace in a toast is both useless and a leak.
 *
 * Nothing here talks to Stripe; the use cases are the seam.
 */
const trial = vi.fn(async () => 'https://checkout.stripe.test/c/1');
const spei = vi.fn(async () => 'https://invoice.stripe.test/i/1');
const portal = vi.fn(async () => 'https://billing.stripe.test/p/1');

vi.mock('../../src/server/billing/live', () => ({
  liveBillingUseCases: () => ({
    trial: { execute: trial },
    spei: { execute: spei },
    portal: { execute: portal },
  }),
}));

vi.mock('../../src/server/auth', () => ({
  requireMember: vi.fn(async () => ({
    business_id: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
    email: 'pedro@taqueria.mx',
  })),
}));

vi.mock('../../src/server/db', () => ({
  withTenant: vi.fn(async (_biz: string, fn: (tx: unknown) => unknown) => fn({})),
}));

vi.mock('@xangarro/data-pg', () => ({
  getBusiness: vi.fn(async () => ({ nombre: 'Taquería Don Pedro' })),
  subscriptionsOfBusiness: vi.fn(async () => []),
}));

vi.mock('../../src/server/geo/record', () => ({ recordGeo: vi.fn(async () => undefined) }));
vi.mock('../../src/server/observability/report', () => ({ reportError: vi.fn() }));
vi.mock('../../src/server/billing/origin', () => ({
  portalOrigin: vi.fn(async () => 'https://app.xangarro.mx'),
}));
vi.mock('../../src/server/billing/config', () => ({ publishableKey: () => 'pk_test_x' }));

/**
 * Imported **once**, in `beforeAll`. It used to be per test, behind a
 * `vi.resetModules()`, which bought nothing: the only env this file stubs is
 * `BILLING_BETA_NO_CHARGE`, and `betaNoCharge()` reads `process.env` when it is
 * called, not when its module loads (`src/server/billing/beta.ts`). What it did
 * cost was eight full re-imports of the actions' transitive graph — 5–10 s
 * each — so under parallel load a test would hit the 5 s default timeout and be
 * killed inside `load()`. The symptom was «Cannot read properties of undefined
 * (reading 'calls')» on a mock the import had not reached yet, which reads like
 * a broken mock and is really a stopwatch.
 */
interface Loaded {
  readonly actions: typeof billingActions;
  readonly recordGeo: MockedFunction<typeof recordGeo>;
  readonly reportError: MockedFunction<typeof reportError>;
}

let loaded: Loaded;
const load = (): Loaded => loaded;

describe('billing actions', () => {
  beforeAll(async () => {
    const actions = await import('../../src/server/billing/actions');
    const geo = await import('../../src/server/geo/record');
    const report = await import('../../src/server/observability/report');
    loaded = {
      actions,
      recordGeo: vi.mocked(geo.recordGeo),
      reportError: vi.mocked(report.reportError),
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('opens Checkout with the session’s business, and counts the purchase', async () => {
    const { actions, recordGeo } = load();
    const r = await actions.iniciarPrueba('xangarro', 'month');

    assert.deepEqual(r, { ok: true, url: 'https://checkout.stripe.test/c/1' });
    const [args] = trial.mock.calls[0] as unknown as [{ business: { id: string; email: string } }];
    // The business and the email come from the signed session, never the caller.
    assert.equal(args.business.id, '01HZ8XQN9GZJXV8AKQ5X0C7BJZ');
    assert.equal(args.business.email, 'pedro@taqueria.mx');
    assert.equal(recordGeo.mock.calls.length, 1);
  });

  it('during the beta no Checkout opens at all', async () => {
    vi.stubEnv('BILLING_BETA_NO_CHARGE', '1');
    const { actions, recordGeo } = load();

    const checkout = await actions.iniciarPrueba('xangarro', 'month');
    const transfer = await actions.pagarAnualPorSpei('xangarro');

    assert.equal(checkout.ok, false);
    assert.equal(transfer.ok, false);
    // The refusal is not the point; never reaching Stripe is.
    assert.equal(trial.mock.calls.length, 0, 'the beta must not open Checkout');
    assert.equal(spei.mock.calls.length, 0, 'the beta must not raise an invoice');
    assert.equal(
      recordGeo.mock.calls.length,
      0,
      'and must not count a purchase that did not happen',
    );
  });

  it('passes the owner-facing billing message through, and reports nothing', async () => {
    // `BillingError` carries a code and derives the sentence (CLAUDE.md §8),
    // so this asserts the shopkeeper sees that sentence — not the code, and
    // not the generic apology.
    const { BillingError } = await import('@xangarro/application/billing');
    const { actions, reportError } = load();
    trial.mockRejectedValueOnce(new BillingError('NOT_A_PAID_PLAN'));

    const r = await actions.iniciarPrueba('xangarrito', 'month');

    assert.deepEqual(r, {
      ok: false,
      message: 'Ese plan no se contrata: Xangarrito es gratis.',
    });
    assert.equal(reportError.mock.calls.length, 0, 'an expected refusal is not an incident');
  });

  it('hides an unexpected failure behind one sentence, and reports it', async () => {
    const { actions, reportError } = load();
    const boom = new Error('connect ECONNREFUSED 10.0.0.1:443');
    spei.mockRejectedValueOnce(boom);

    const r = await actions.pagarAnualPorSpei('xangarro');

    assert.equal(r.ok, false);
    assert.equal(
      r.ok === false && r.message,
      'No pudimos abrir el pago. Intenta de nuevo en un momento.',
    );
    assert.equal(reportError.mock.calls.length, 1);
    const [error, scope] = reportError.mock.calls[0] ?? [];
    assert.equal(error, boom);
    assert.deepEqual(scope, { endpoint: 'pagarAnualPorSpei' });
  });

  it('a refused permission answers its own message, not the generic one', async () => {
    const { actions, reportError } = load();
    portal.mockRejectedValueOnce(
      Object.assign(new Error('Inicia sesión para continuar.'), { code: 'NOT_PERMITTED' }),
    );

    const r = await actions.administrarSuscripcion();

    assert.deepEqual(r, { ok: false, message: 'Inicia sesión para continuar.' });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('the customer portal returns to Suscripción', async () => {
    const { actions } = load();
    const r = await actions.administrarSuscripcion();

    assert.equal(r.ok, true);
    const [args] = portal.mock.calls[0] as unknown as [{ returnUrl: string }];
    assert.equal(args.returnUrl, 'https://app.xangarro.mx/suscripcion');
  });

  it('the free plan reads as null, and any member may look', async () => {
    const { actions } = load();
    assert.equal(await actions.estadoSuscripcion(), null);
  });

  it('exposes the publishable key for P-10', async () => {
    const { actions } = load();
    assert.equal(await actions.stripePublishableKey(), 'pk_test_x');
  });
});
