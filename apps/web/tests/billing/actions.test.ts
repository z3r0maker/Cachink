import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';
import { BillingError } from '@xangarro/application/billing';

/**
 * The Suscripción screen's server actions (P-10). The E2E suite runs without
 * Stripe, so it never gets past the button: what each action sends to the use
 * case, and how each failure reaches the owner, is proven here with the
 * session, the tenant, Stripe's use cases and the request origin replaced at
 * their module boundaries.
 */

const trial = vi.fn();
const spei = vi.fn();
const portal = vi.fn();
const requireMember = vi.fn();
const reportError = vi.fn();
const recordGeo = vi.fn();

vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) => fn({}),
}));
vi.mock('@xangarro/data-pg', () => ({
  getBusiness: () => Promise.resolve({ nombre: 'Taquería Don Pedro' }),
  subscriptionsOfBusiness: () => Promise.resolve([]),
}));
vi.mock('../../src/server/billing/live', () => ({
  liveBillingUseCases: () => ({
    trial: { execute: trial },
    spei: { execute: spei },
    portal: { execute: portal },
  }),
}));
vi.mock('../../src/server/billing/origin', () => ({
  portalOrigin: () => Promise.resolve('https://app.xangarro.mx'),
}));
vi.mock('../../src/server/billing/config', () => ({ publishableKey: () => 'pk_test_x' }));
vi.mock('../../src/server/geo/record', () => ({ recordGeo }));
vi.mock('../../src/server/observability/report', () => ({ reportError }));

const actions = await import('../../src/server/billing/actions');

const OWNER = { business_id: 'biz-1', email: 'pedro@taqueria.mx', member_role: 'owner' };

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue(OWNER);
});

describe('iniciarPrueba — Stripe Checkout for the owner', () => {
  it('sends the session’s business and email, and Suscripción as both return paths', async () => {
    trial.mockResolvedValue('https://checkout.stripe.com/c/s_1');
    assert.deepEqual(await actions.iniciarPrueba('xangarro', 'month'), {
      ok: true,
      url: 'https://checkout.stripe.com/c/s_1',
    });
    assert.deepEqual(requireMember.mock.calls[0], ['owner']);
    assert.deepEqual(trial.mock.calls[0]?.[0], {
      business: { id: 'biz-1', name: 'Taquería Don Pedro', email: 'pedro@taqueria.mx' },
      plan: 'xangarro',
      interval: 'month',
      successUrl: 'https://app.xangarro.mx/suscripcion?pago=listo&session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://app.xangarro.mx/suscripcion',
    });
    assert.deepEqual(recordGeo.mock.calls[0], ['compra']);
  });

  it('a billing rule the owner broke comes back as its own message, not reported', async () => {
    trial.mockRejectedValue(new BillingError('ALREADY_SUBSCRIBED'));
    const r = await actions.iniciarPrueba('xangarro', 'month');
    assert.deepEqual(r, { ok: false, message: new BillingError('ALREADY_SUBSCRIBED').message });
    assert.equal(reportError.mock.calls.length, 0);
    assert.equal(recordGeo.mock.calls.length, 0);
  });

  it('a non-owner is refused with the permission message', async () => {
    requireMember.mockRejectedValue(
      Object.assign(new Error('Solo el dueño puede hacer esto.'), { code: 'NOT_PERMITTED' }),
    );
    assert.deepEqual(await actions.iniciarPrueba('xangarro', 'month'), {
      ok: false,
      message: 'Solo el dueño puede hacer esto.',
    });
    assert.equal(trial.mock.calls.length, 0);
  });

  it('anything else is reported and the owner gets the generic retry message', async () => {
    const boom = new Error('stripe is down');
    trial.mockRejectedValue(boom);
    const r = await actions.iniciarPrueba('xangarro', 'year');
    assert.deepEqual(r, {
      ok: false,
      message: 'No pudimos abrir el pago. Intenta de nuevo en un momento.',
    });
    assert.deepEqual(reportError.mock.calls[0], [boom, { endpoint: 'iniciarPrueba' }]);
  });
});

describe('pagarAnualPorSpei and administrarSuscripcion', () => {
  it('SPEI returns the hosted invoice for the plan and records the purchase', async () => {
    spei.mockResolvedValue('https://invoice.stripe.com/i/1');
    assert.deepEqual(await actions.pagarAnualPorSpei('xangarro'), {
      ok: true,
      url: 'https://invoice.stripe.com/i/1',
    });
    assert.equal((spei.mock.calls[0]?.[0] as { plan: string }).plan, 'xangarro');
    assert.deepEqual(recordGeo.mock.calls[0], ['compra']);
  });

  it('SPEI failures are reported under their own endpoint', async () => {
    spei.mockRejectedValue(new Error('timeout'));
    assert.equal((await actions.pagarAnualPorSpei('xangarro')).ok, false);
    assert.equal(
      (reportError.mock.calls[0]?.[1] as { endpoint: string }).endpoint,
      'pagarAnualPorSpei',
    );
  });

  it('the Customer Portal comes back to Suscripción, for the session’s business', async () => {
    portal.mockResolvedValue('https://billing.stripe.com/p/1');
    assert.deepEqual(await actions.administrarSuscripcion(), {
      ok: true,
      url: 'https://billing.stripe.com/p/1',
    });
    assert.deepEqual(portal.mock.calls[0]?.[0], {
      businessId: 'biz-1',
      returnUrl: 'https://app.xangarro.mx/suscripcion',
    });
  });

  it('no Stripe customer yet is the owner’s message, not an incident', async () => {
    portal.mockRejectedValue(new BillingError('NO_BILLING_CUSTOMER'));
    const r = await actions.administrarSuscripcion();
    assert.equal(r.ok, false);
    assert.equal(reportError.mock.calls.length, 0);
  });
});

describe('the read side', () => {
  it('the free plan is null, open to any member', async () => {
    assert.equal(await actions.estadoSuscripcion(), null);
    assert.deepEqual(requireMember.mock.calls[0], ['viewer']);
  });

  it('the publishable key passes through', async () => {
    assert.equal(await actions.stripePublishableKey(), 'pk_test_x');
  });
});
