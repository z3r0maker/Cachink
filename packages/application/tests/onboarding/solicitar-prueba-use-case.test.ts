import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { BusinessId } from '@xangarro/domain';

import { SolicitarPruebaUseCase } from '../../src/index.js';
import { FakeTrialCheckout, InMemoryOnboardingStore } from '../support/in-memory-onboarding.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function build(checkout = new FakeTrialCheckout()) {
  const store = new InMemoryOnboardingStore();
  return { store, checkout, useCase: new SolicitarPruebaUseCase(store, checkout) };
}

describe('SolicitarPruebaUseCase (N-13 — [Probar 14 días])', () => {
  it('records the intent and reports that Checkout is not available yet', async () => {
    const { store, checkout, useCase } = build();
    const result = await useCase.execute({ businessId: BIZ, plan: 'xangarro', interval: 'anual' });

    assert.deepEqual(result, { status: 'unavailable' });
    assert.equal(store.record?.trialIntent?.plan, 'xangarro');
    assert.equal(store.record?.trialIntent?.interval, 'anual');
    assert.deepEqual(checkout.calls, [{ businessId: BIZ, plan: 'xangarro', interval: 'anual' }]);
  });

  it('passes a Checkout redirect straight through once one exists', async () => {
    const url = 'https://checkout.stripe.com/c/pay/cs_test_1';
    const { useCase } = build(new FakeTrialCheckout({ status: 'redirect', url }));
    const result = await useCase.execute({
      businessId: BIZ,
      plan: 'xangarrote',
      interval: 'mensual',
    });
    assert.deepEqual(result, { status: 'redirect', url });
  });

  it('refuses a trial of the free plan', async () => {
    const { store, checkout, useCase } = build();
    await assert.rejects(
      useCase.execute({ businessId: BIZ, plan: 'xangarrito', interval: 'mensual' }),
      { code: 'NOT_A_PAID_PLAN' },
    );
    assert.equal(store.writes, 0);
    assert.equal(checkout.calls.length, 0);
  });

  it('refuses an unknown plan', async () => {
    const { useCase } = build();
    await assert.rejects(
      useCase.execute({ businessId: BIZ, plan: 'enterprise' as 'xangarro', interval: 'mensual' }),
      { code: 'NOT_A_PAID_PLAN' },
    );
  });

  it('refuses an unknown billing interval', async () => {
    const { useCase } = build();
    await assert.rejects(
      useCase.execute({ businessId: BIZ, plan: 'xangarro', interval: 'semanal' as 'anual' }),
      { code: 'NOT_A_PAID_PLAN' },
    );
  });
});
