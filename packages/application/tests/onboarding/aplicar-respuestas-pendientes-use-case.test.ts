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
import {
  AplicarConfiguracionUseCase,
  AplicarRespuestasPendientesUseCase,
} from '../../src/index.js';
import { InMemoryOnboardingStore } from '../support/in-memory-onboarding.js';

const NOTHING = new Set<FeatureFlagKey>();
const PAID = new Set<FeatureFlagKey>(['stock', 'barcode', 'ventasCredito']);

/**
 * The subscription webhook's side of N-13: once a plan that covers the
 * answers the free plan could not honour is in force, apply them — and only
 * then, so an unrelated billing event never re-applies the wizard.
 */
describe('AplicarRespuestasPendientesUseCase (N-13 × B-10)', () => {
  let businesses: InMemoryBusinessesRepository;
  let store: InMemoryOnboardingStore;
  let useCase: AplicarRespuestasPendientesUseCase;
  let BIZ: BusinessId;

  const flags = async () => parseFeatureFlags((await businesses.findById(BIZ))!.featureFlags);

  async function seguirGratis(answers: WizardAnswers): Promise<void> {
    await store.saveAnswers(answers);
    await new AplicarConfiguracionUseCase(businesses, store).execute({
      businessId: BIZ,
      plan: 'xangarrito',
      allowed: NOTHING,
    });
    store.writes = 0;
  }

  beforeEach(async () => {
    businesses = new InMemoryBusinessesRepository(TEST_DEVICE_ID);
    BIZ = (await businesses.create(makeNewBusiness())).id;
    store = new InMemoryOnboardingStore();
    useCase = new AplicarRespuestasPendientesUseCase(businesses, store);
  });

  it('an upgrade that covers the pending answers applies them and clears them', async () => {
    await seguirGratis({ manejaInventario: true, vendeACredito: true });
    assert.equal((await flags()).ventasCredito, false);

    const result = await useCase.execute({ businessId: BIZ, plan: 'xangarro', allowed: PAID });

    assert.notEqual(result, null);
    assert.equal((await flags()).ventasCredito, true);
    assert.deepEqual(store.record?.pendingPaidAnswers, []);
  });

  it('does nothing when the wizard was never applied', async () => {
    await store.saveAnswers({ vendeACredito: true });
    store.writes = 0;
    const result = await useCase.execute({ businessId: BIZ, plan: 'xangarro', allowed: PAID });
    assert.equal(result, null);
    assert.equal(store.writes, 0);
    assert.equal((await flags()).ventasCredito, false);
  });

  it('does nothing when there is no onboarding row at all', async () => {
    const result = await useCase.execute({ businessId: BIZ, plan: 'xangarro', allowed: PAID });
    assert.equal(result, null);
    assert.equal(store.record, null);
  });

  it('does nothing when nothing is pending (a renewal never re-applies the wizard)', async () => {
    await seguirGratis({ manejaInventario: false });
    const result = await useCase.execute({ businessId: BIZ, plan: 'xangarro', allowed: PAID });
    assert.equal(result, null);
    assert.equal(store.writes, 0);
  });

  it('does nothing when the plan in force still does not cover a pending answer', async () => {
    await seguirGratis({ manejaInventario: true });
    const result = await useCase.execute({
      businessId: BIZ,
      plan: 'xangarrito',
      allowed: NOTHING,
    });
    assert.equal(result, null);
    assert.equal(store.writes, 0);
    assert.equal(store.record?.pendingPaidAnswers.length, 1);
  });
});
