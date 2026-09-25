import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';
import { PLAN_IDS } from '@xangarro/domain';

import { skipKeys } from '../../src/onboarding/wizard-steps';

/**
 * The wizard's server actions (N-12 … N-15). The E2E onboarding spec walks the
 * free path; the re-run against the current plan, the trial checkout, and
 * every failure — shown or reported — are here, with the use cases replaced
 * at their module boundary and the real error mapper in place.
 */

const requireMember = vi.fn();
const reportError = vi.fn();
const revalidatePath = vi.fn();
const guardar = vi.fn();
const aplicar = vi.fn();
const solicitar = vi.fn();
const tenantEntitlement = vi.fn();
const trialCheckoutFor = vi.fn();
const recordGeo = vi.fn();
const getBusiness = vi.fn();
const find = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) => fn({ tx: true }),
}));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('../../src/server/billing/origin', () => ({
  portalOrigin: () => Promise.resolve('https://app.xangarro.mx'),
}));
vi.mock('../../src/server/billing/plan', () => ({ tenantEntitlement }));
vi.mock('../../src/server/geo/record', () => ({ recordGeo }));
vi.mock('../../src/server/onboarding/checkout', () => ({ trialCheckoutFor }));
vi.mock('../../src/server/onboarding/store', () => ({ pgOnboardingStore: () => ({ find }) }));
vi.mock('../../src/server/repositories/businesses', () => ({ pgBusinessesRepository: vi.fn() }));
vi.mock('@xangarro/data-pg', () => ({ getBusiness }));
vi.mock('@xangarro/application', () => ({
  GuardarRespuestasUseCase: class {
    execute = guardar;
  },
  AplicarConfiguracionUseCase: class {
    execute = aplicar;
  },
  SolicitarPruebaUseCase: class {
    execute = solicitar;
  },
}));

const actions = await import('../../src/server/actions/onboarding');

const coded = (code: string, message: string) => Object.assign(new Error(message), { code });
const GENERIC = 'No pudimos guardar. Intenta de nuevo.';

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue({ business_id: 'biz-1', email: 'pedro@taqueria.mx' });
  find.mockResolvedValue({ answers: {} });
});

describe('guardarPaso', () => {
  it('saves the step and answers what is now stored', async () => {
    guardar.mockResolvedValue({ inventario: true });
    const r = await actions.guardarPaso(2, { inventario: true } as never, false);
    assert.deepEqual(r, { ok: true, answers: { inventario: true } });
    assert.deepEqual(requireMember.mock.calls[0], ['owner']);
  });

  it('a skipped step clears its keys instead of saving a patch', async () => {
    guardar.mockResolvedValue({});
    await actions.guardarPaso(3, {} as never, true);
    assert.deepEqual(guardar.mock.calls[0]?.[0], { patch: {}, clear: skipKeys(3) });
  });

  it('a malformed answer is the wizard’s own copy, not the domain’s log line', async () => {
    guardar.mockRejectedValue(coded('INVALID_WIZARD_ANSWERS', 'answers.cobros: expected enum'));
    assert.deepEqual(await actions.guardarPaso(2, {} as never, false), {
      ok: false,
      message: 'Revisa tu respuesta: hay un dato que no pudimos guardar.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('an outage is reported with the business and gets the generic line', async () => {
    const boom = new Error('connection reset');
    guardar.mockRejectedValue(boom);
    assert.deepEqual(await actions.guardarPaso(2, {} as never, false), {
      ok: false,
      message: GENERIC,
    });
    assert.deepEqual(reportError.mock.calls[0], [
      boom,
      { endpoint: 'guardarPaso', businessId: 'biz-1' },
    ]);
  });

  it('a failure before the session is known is reported without a business', async () => {
    const boom = new Error('cookie store unavailable');
    requireMember.mockRejectedValue(boom);
    await actions.guardarPaso(2, {} as never, false);
    assert.deepEqual(reportError.mock.calls[0], [boom, { endpoint: 'guardarPaso' }]);
  });
});

describe('seguirGratis and aplicarCambios', () => {
  it('[Seguir gratis] configures for the free plan, for real, and refreshes Negocio', async () => {
    assert.deepEqual(await actions.seguirGratis(), { ok: true });
    const input = aplicar.mock.calls[0]?.[0] as {
      plan: string;
      dryRun: boolean;
      businessId: string;
    };
    assert.equal(input.plan, PLAN_IDS[0]);
    assert.equal(input.dryRun, false);
    assert.equal(input.businessId, 'biz-1');
    assert.deepEqual(revalidatePath.mock.calls, [['/negocio']]);
  });

  it('a re-run applies against the plan the business is on', async () => {
    tenantEntitlement.mockResolvedValue({ plan: 'xangarro' });
    assert.deepEqual(await actions.aplicarCambios(), { ok: true });
    assert.equal((aplicar.mock.calls[0]?.[0] as { plan: string }).plan, 'xangarro');
  });

  it('a flag the plan does not allow is shown, not reported', async () => {
    aplicar.mockRejectedValue(coded('FLAG_NOT_ALLOWED', 'Tu plan no incluye esta función.'));
    assert.deepEqual(await actions.aplicarCambios(), {
      ok: false,
      message: 'Tu plan no incluye esta función.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('an outage is reported under its own endpoint', async () => {
    aplicar.mockRejectedValue(new Error('timeout'));
    assert.deepEqual(await actions.seguirGratis(), { ok: false, message: GENERIC });
    assert.equal((reportError.mock.calls[0]?.[1] as { endpoint: string }).endpoint, 'seguirGratis');
  });
});

describe('probarGratis', () => {
  // P-36.3: the paid tap applies the free-plan configuration first; an earlier
  // group may have left the mock rejecting, so it answers here.
  beforeEach(() => aplicar.mockResolvedValue(undefined));

  it('records the intent, sends the owner to Checkout, and counts the purchase region', async () => {
    getBusiness.mockResolvedValue({ nombre: 'Taquería Don Pedro' });
    trialCheckoutFor.mockReturnValue('checkout-port');
    solicitar.mockResolvedValue({ status: 'redirect', url: 'https://checkout.stripe.com/c/1' });
    const r = await actions.probarGratis('xangarro' as never, 'month');
    assert.deepEqual(r, { ok: true, redirect: 'https://checkout.stripe.com/c/1', beta: false });
    // P-36.3: the free-plan configuration is applied before Checkout, on this path too.
    assert.equal(aplicar.mock.calls.length, 1);
    assert.equal((aplicar.mock.calls[0]?.[0] as { plan: string }).plan, PLAN_IDS[0]);
    assert.deepEqual(revalidatePath.mock.calls, [['/negocio']]);
    assert.deepEqual(trialCheckoutFor.mock.calls[0], [
      { id: 'biz-1', name: 'Taquería Don Pedro', email: 'pedro@taqueria.mx' },
      'https://app.xangarro.mx',
    ]);
    assert.deepEqual(solicitar.mock.calls[0]?.[0], {
      businessId: 'biz-1',
      plan: 'xangarro',
      interval: 'month',
    });
    assert.deepEqual(recordGeo.mock.calls, [['compra']]);
  });

  it('no redirect (billing not configured) is ok, sends nowhere, and counts nothing', async () => {
    getBusiness.mockResolvedValue(null);
    solicitar.mockResolvedValue({ status: 'recorded' });
    assert.deepEqual(await actions.probarGratis('xangarro' as never, 'year'), {
      ok: true,
      redirect: null,
      beta: false,
    });
    assert.equal((trialCheckoutFor.mock.calls[0]?.[0] as { name: string }).name, 'Mi negocio');
    assert.equal(recordGeo.mock.calls.length, 0);
  });

  it('during the beta (D-1) nothing is charged: configured, intent kept, Checkout never built', async () => {
    vi.stubEnv('BILLING_BETA_NO_CHARGE', '1');
    try {
      getBusiness.mockResolvedValue({ nombre: 'Taquería Don Pedro' });
      solicitar.mockResolvedValue({ status: 'unavailable' });
      assert.deepEqual(await actions.probarGratis('xangarro' as never, 'month'), {
        ok: true,
        redirect: null,
        beta: true,
      });
      assert.equal(aplicar.mock.calls.length, 1);
      assert.equal(trialCheckoutFor.mock.calls.length, 0);
      assert.equal(solicitar.mock.calls.length, 1, 'the choice is still recorded');
      assert.equal(recordGeo.mock.calls.length, 0);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('the free plan cannot be tried, and says so', async () => {
    solicitar.mockRejectedValue(coded('NOT_A_PAID_PLAN', 'Ese plan no tiene prueba.'));
    assert.deepEqual(await actions.probarGratis('xangarrito' as never, 'month'), {
      ok: false,
      message: 'Ese plan no tiene prueba.',
    });
  });
});
