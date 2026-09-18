import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  parseFeatureFlags,
  type BusinessId,
  type FeatureFlagKey,
  type WizardAnswers,
} from '@xangarro/domain';

import {
  InMemoryBusinessesRepository,
  TEST_DEVICE_ID,
  makeNewBusiness,
} from '../../../testing/src/index.js';
import { AplicarConfiguracionUseCase } from '../../src/index.js';
import { InMemoryOnboardingStore } from '../support/in-memory-onboarding.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const EVERYTHING = new Set<FeatureFlagKey>(['stock', 'barcode', 'ventasCredito']);

describe('AplicarConfiguracionUseCase (N-13, N-15)', () => {
  let businesses: InMemoryBusinessesRepository;
  let store: InMemoryOnboardingStore;
  let useCase: AplicarConfiguracionUseCase;
  let businessId: BusinessId;
  let updates: number;

  async function answer(answers: WizardAnswers): Promise<void> {
    await store.saveAnswers(answers);
    store.writes = 0;
  }

  const read = async () => {
    const b = await businesses.findById(businessId);
    return {
      flags: parseFeatureFlags(b!.featureFlags),
      payments: JSON.parse(b!.enabledPaymentMethods) as string[],
      nombre: b!.nombre,
    };
  };

  beforeEach(async () => {
    businesses = new InMemoryBusinessesRepository(TEST_DEVICE_ID);
    businessId = (await businesses.create(makeNewBusiness({ businessId: BIZ }))).id;
    updates = 0;
    const update = businesses.update.bind(businesses);
    businesses.update = (id, patch) => {
      updates += 1;
      return update(id, patch);
    };
    store = new InMemoryOnboardingStore();
    useCase = new AplicarConfiguracionUseCase(businesses, store);
  });

  it('"Seguir gratis": applies what the free plan allows and keeps the rest pending', async () => {
    await answer({
      nombre: 'Tortas Lupita',
      metodosCobro: ['Efectivo', 'Tarjeta'],
      manejaInventario: true,
      vendeACredito: true,
    });
    const result = await useCase.execute({ businessId, plan: 'xangarrito', allowed: new Set() });

    const after = await read();
    assert.deepEqual(after.payments, ['Efectivo', 'Tarjeta'], 'Crédito is not in the free plan');
    assert.equal(after.nombre, 'Tortas Lupita');
    assert.equal(result.suggestedPlan, 'xangarro');
    assert.deepEqual(result.reasons, ['INVENTARIO', 'VENTAS_A_CREDITO']);
    assert.deepEqual(
      store.record?.pendingPaidAnswers.map((p) => p.answer),
      ['manejaInventario', 'vendeACredito'],
    );
    assert.notEqual(store.record?.completedAt, null);
  });

  it('turns features off with their dependents when the answers say so', async () => {
    await answer({ manejaInventario: false });
    const result = await useCase.execute({ businessId, plan: 'xangarro', allowed: EVERYTHING });
    assert.equal((await read()).flags.stock, false);
    assert.deepEqual(result.changes, [{ kind: 'feature', key: 'stock', enabled: false }]);
  });

  it('on a paid plan enables credit and adds Crédito as a payment method', async () => {
    await answer({ vendeACredito: true });
    await useCase.execute({ businessId, plan: 'xangarro', allowed: EVERYTHING });
    const after = await read();
    assert.equal(after.flags.ventasCredito, true);
    assert.ok(after.payments.includes('Crédito'));
  });

  it('never enables a feature the platform has not released, even on a paid plan', async () => {
    await answer({ vendeACredito: true });
    const result = await useCase.execute({
      businessId,
      plan: 'xangarro',
      allowed: new Set(['stock', 'barcode']),
    });
    const after = await read();
    assert.equal(after.flags.ventasCredito, false);
    assert.equal(after.payments.includes('Crédito'), false);
    assert.deepEqual(result.changes, []);
  });

  it('previews "esto cambiará" without writing anything', async () => {
    await answer({ manejaInventario: false, metodosCobro: ['Efectivo'] });
    const result = await useCase.execute({
      businessId,
      plan: 'xangarro',
      allowed: EVERYTHING,
      dryRun: true,
    });
    assert.ok(result.changes.length > 0);
    assert.equal(updates, 0);
    assert.equal(store.writes, 0);
    assert.equal((await read()).flags.stock, true);
  });

  it('is a no-op the second time: nothing changes, nothing is written to the business', async () => {
    await answer({ manejaInventario: false, metodosCobro: ['Efectivo'] });
    await useCase.execute({ businessId, plan: 'xangarro', allowed: EVERYTHING });
    updates = 0;
    const again = await useCase.execute({ businessId, plan: 'xangarro', allowed: EVERYTHING });
    assert.deepEqual(again.changes, []);
    assert.equal(updates, 0);
  });

  it('refuses a business that does not exist', async () => {
    await assert.rejects(
      useCase.execute({
        businessId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as BusinessId,
        plan: 'xangarro',
        allowed: EVERYTHING,
      }),
      { code: 'BUSINESS_NOT_FOUND' },
    );
  });

  it('refuses corrupt stored answers instead of applying half of them', async () => {
    store.record = {
      answers: { personasQueCobran: 0 },
      pendingPaidAnswers: [],
      completedAt: null,
      trialIntent: null,
    };
    await assert.rejects(useCase.execute({ businessId, plan: 'xangarro', allowed: EVERYTHING }), {
      code: 'INVALID_WIZARD_ANSWERS',
    });
    assert.equal(updates, 0);
  });

  it('refuses an unknown plan', async () => {
    await answer({ manejaInventario: true });
    await assert.rejects(
      useCase.execute({
        businessId,
        plan: 'enterprise' as 'xangarro',
        allowed: EVERYTHING,
      }),
      { code: 'UNKNOWN_PLAN' },
    );
  });
});
