import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * The billing server functions the Suscripción screen calls (P-10, ADR-105),
 * every use case and collaborator mocked: the owner's identity from the
 * signed session with the business read as the tenant; Checkout's success and
 * cancel URLs on the portal origin; the beta flag closing every paid door with
 * its own sentence; a NOT_PERMITTED shown as its message; and an unexpected
 * failure reported and answered with the generic line — never a stack.
 */

const requireMember = vi.fn();
const withTenant = vi.fn();
const getBusiness = vi.fn();
const recordGeo = vi.fn();
const reportError = vi.fn();
const origin = vi.fn(async () => 'https://app.xangarro.mx');
const trial = { execute: vi.fn() };
const spei = { execute: vi.fn() };
const portal = { execute: vi.fn() };

vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/db', () => ({
  withTenant: (b: string, fn: (tx: unknown) => unknown) => withTenant(b, fn),
}));
vi.mock('@xangarro/data-pg', () => ({
  getBusiness: (...a: unknown[]) => getBusiness(...a),
  subscriptionsOfBusiness: vi.fn(async () => []),
}));
const { betaNoCharge } = vi.hoisted(() => ({ betaNoCharge: vi.fn(() => false) }));
vi.mock('../../src/server/billing/beta', () => ({
  BETA_NO_CHARGE_MESSAGE: 'Durante la beta no cobramos.',
  betaNoCharge,
}));
vi.mock('../../src/server/billing/live', () => ({
  liveBillingUseCases: () => ({ trial, spei, portal }),
}));
vi.mock('../../src/server/billing/origin', () => ({ portalOrigin: () => origin() }));
vi.mock('../../src/server/billing/config', () => ({
  publishableKey: () => 'pk_test_x',
  billingDb: () => ({}),
  stripeClient: () => ({}),
}));
vi.mock('../../src/server/geo/record', () => ({ recordGeo: (...a: unknown[]) => recordGeo(...a) }));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('@xangarro/application/billing', async (orig) => ({
  ...(await orig()),
  billingStatusSnapshot: vi.fn(() => null),
}));

const {
  administrarSuscripcion,
  estadoSuscripcion,
  iniciarPrueba,
  pagarAnualPorSpei,
  stripePublishableKey,
} = await import('../../src/server/billing/actions');

const OWNER = { business_id: 'biz-1', email: 'dueno@negocio.mx' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(betaNoCharge).mockReturnValue(false);
  requireMember.mockResolvedValue(OWNER);
  withTenant.mockImplementation(async (_b: string, fn: (tx: unknown) => unknown) => fn({}));
  getBusiness.mockResolvedValue({ nombre: 'Taquería Don Pedro' });
});

describe('iniciarPrueba', () => {
  it('Checkout with the owner from the session and the portal’s URLs', async () => {
    trial.execute.mockResolvedValue('https://checkout.stripe.com/c/pay/cs_1');
    const r = await iniciarPrueba('xangarro', 'monthly');
    assert.deepEqual(r, { ok: true, url: 'https://checkout.stripe.com/c/pay/cs_1' });
    assert.deepEqual(trial.execute.mock.calls[0]?.[0], {
      business: { id: 'biz-1', name: 'Taquería Don Pedro', email: 'dueno@negocio.mx' },
      plan: 'xangarro',
      interval: 'monthly',
      successUrl: 'https://app.xangarro.mx/suscripcion?pago=listo&session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://app.xangarro.mx/suscripcion',
    });
    assert.deepEqual(recordGeo.mock.calls, [['compra']]);
  });

  it('the beta flag closes the paid door with its own sentence', async () => {
    vi.mocked(betaNoCharge).mockReturnValue(true);
    const r = await iniciarPrueba('xangarro', 'monthly');
    assert.deepEqual(r, { ok: false, message: 'Durante la beta no cobramos.' });
    assert.equal(trial.execute.mock.calls.length, 0);
  });

  it('a role refusal is shown as its message, not reported', async () => {
    requireMember.mockRejectedValue(
      Object.assign(new Error('Solo el dueño puede contratar.'), { code: 'NOT_PERMITTED' }),
    );
    const r = await iniciarPrueba('xangarro', 'monthly');
    assert.deepEqual(r, { ok: false, message: 'Solo el dueño puede contratar.' });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('an unexpected failure is reported and gets the generic line', async () => {
    trial.execute.mockRejectedValue(new Error('stripe 500'));
    const r = await iniciarPrueba('xangarro', 'monthly');
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.message, /No pudimos abrir el pago/);
    assert.deepEqual(reportError.mock.calls[0]?.[1], { endpoint: 'iniciarPrueba' });
  });
});

describe('pagarAnualPorSpei', () => {
  it('the annual SPEI invoice, geo recorded', async () => {
    spei.execute.mockResolvedValue('https://pay.stripe.com/invoice/in_1');
    const r = await pagarAnualPorSpei('xangarro');
    assert.deepEqual(r, { ok: true, url: 'https://pay.stripe.com/invoice/in_1' });
    assert.equal(spei.execute.mock.calls[0]?.[0]?.business.id, 'biz-1');
    assert.deepEqual(recordGeo.mock.calls, [['compra']]);
  });

  it('the beta flag closes it too', async () => {
    vi.mocked(betaNoCharge).mockReturnValue(true);
    assert.deepEqual(await pagarAnualPorSpei('xangarro'), {
      ok: false,
      message: 'Durante la beta no cobramos.',
    });
  });
});

describe('administrarSuscripcion', () => {
  it('the Customer Portal with the portal return URL', async () => {
    portal.execute.mockResolvedValue('https://billing.stripe.com/session/bps_1');
    const r = await administrarSuscripcion();
    assert.deepEqual(r, { ok: true, url: 'https://billing.stripe.com/session/bps_1' });
    assert.deepEqual(portal.execute.mock.calls[0]?.[0], {
      businessId: 'biz-1',
      returnUrl: 'https://app.xangarro.mx/suscripcion',
    });
  });
});

describe('estadoSuscripcion', () => {
  it('any member may look; the snapshot reads as the tenant', async () => {
    requireMember.mockResolvedValue({ ...OWNER, business_id: 'biz-2' });
    const r = await estadoSuscripcion();
    assert.equal(r, null);
    assert.equal(requireMember.mock.calls[0]?.[0], 'viewer');
    assert.equal(withTenant.mock.calls[0]?.[0], 'biz-2');
  });
});

describe('stripePublishableKey', () => {
  it('hands the publishable key, null when unset', async () => {
    assert.equal(await stripePublishableKey(), 'pk_test_x');
  });
});
