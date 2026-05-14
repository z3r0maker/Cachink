import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId } from '@cachink/domain';
import {
  InMemoryBusinessesRepository,
  TEST_DEVICE_ID,
  makeNewBusiness,
} from '../../testing/src/index.js';
import { ToggleFeatureFlagUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('ToggleFeatureFlagUseCase', () => {
  let businesses: InMemoryBusinessesRepository;
  let useCase: ToggleFeatureFlagUseCase;
  let businessId: BusinessId;

  beforeEach(async () => {
    businesses = new InMemoryBusinessesRepository(TEST_DEVICE_ID);
    useCase = new ToggleFeatureFlagUseCase(businesses);
    const biz = await businesses.create(makeNewBusiness({ businessId: BIZ }));
    businessId = biz.id;
  });

  it('enables a flag that has no dependencies', async () => {
    const result = await useCase.execute({
      businessId, flagKey: 'caja', newValue: true,
    });
    expect(result.caja).toBe(true);
  });

  it('enables merma when stock is ON', async () => {
    const result = await useCase.execute({
      businessId, flagKey: 'merma', newValue: true,
    });
    expect(result.merma).toBe(true);
  });

  it('rejects enabling merma when stock is OFF', async () => {
    // First disable stock
    await useCase.execute({ businessId, flagKey: 'stock', newValue: false });
    await expect(
      useCase.execute({ businessId, flagKey: 'merma', newValue: true }),
    ).rejects.toThrow(/dependencia/);
  });

  it('cascade-disables dependents when disabling stock', async () => {
    // Enable merma + auditoría first
    await useCase.execute({ businessId, flagKey: 'merma', newValue: true });
    await useCase.execute({ businessId, flagKey: 'auditoriaInventario', newValue: true });

    const result = await useCase.execute({
      businessId, flagKey: 'stock', newValue: false,
    });
    expect(result.stock).toBe(false);
    expect(result.merma).toBe(false);
    expect(result.auditoriaInventario).toBe(false);
    // Independent flags unaffected
    expect(result.caja).toBe(false);
  });

  it('persists the updated flags to the business', async () => {
    await useCase.execute({ businessId, flagKey: 'caja', newValue: true });
    const biz = await businesses.findById(businessId);
    const flags = JSON.parse(biz!.featureFlags);
    expect(flags.caja).toBe(true);
  });

  it('rejects non-existent business', async () => {
    await expect(
      useCase.execute({
        businessId: '01HZ8XQN9GZJXV8AKQ5XGHOST' as BusinessId,
        flagKey: 'caja',
        newValue: true,
      }),
    ).rejects.toThrow(/no encontrado/);
  });
});
