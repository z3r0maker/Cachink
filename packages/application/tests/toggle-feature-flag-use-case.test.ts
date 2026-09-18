import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId } from '@xangarro/domain';
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
      businessId,
      flagKey: 'ventasCredito',
      newValue: true,
    });
    expect(result.ventasCredito).toBe(true);
  });

  it('enables merma when stock is ON', async () => {
    const result = await useCase.execute({
      businessId,
      flagKey: 'merma',
      newValue: true,
    });
    expect(result.merma).toBe(true);
  });

  it('rejects enabling merma when stock is OFF', async () => {
    // First disable stock
    await useCase.execute({ businessId, flagKey: 'stock', newValue: false });
    await expect(useCase.execute({ businessId, flagKey: 'merma', newValue: true })).rejects.toThrow(
      /dependencia/,
    );
  });

  it('cascade-disables dependents when disabling stock', async () => {
    // Enable merma + auditoría first
    await useCase.execute({ businessId, flagKey: 'merma', newValue: true });
    await useCase.execute({ businessId, flagKey: 'auditoriaInventario', newValue: true });

    const result = await useCase.execute({
      businessId,
      flagKey: 'stock',
      newValue: false,
    });
    expect(result.stock).toBe(false);
    expect(result.merma).toBe(false);
    expect(result.auditoriaInventario).toBe(false);
    // Independent flags unaffected
    expect(result.ventasCredito).toBe(false);
  });

  it('persists the updated flags to the business', async () => {
    await useCase.execute({ businessId, flagKey: 'ventasCredito', newValue: true });
    const biz = await businesses.findById(businessId);
    const flags = JSON.parse(biz!.featureFlags);
    expect(flags.ventasCredito).toBe(true);
  });

  it('rejects non-existent business', async () => {
    await expect(
      useCase.execute({
        businessId: '01HZ8XQN9GZJXV8AKQ5XGHOST' as BusinessId,
        flagKey: 'ventasCredito',
        newValue: true,
      }),
    ).rejects.toThrow(/no encontrado/);
  });

  describe('what a caller may enable (P-15: the portal passes platform ∩ plan)', () => {
    const allowed = new Set(['stock', 'barcode'] as const);

    it('refuses to enable a key outside the allowed set, with a typed error, and stores nothing', async () => {
      await expect(
        useCase.execute({ businessId, flagKey: 'ventasCredito', newValue: true, allowed }),
      ).rejects.toMatchObject({ code: 'FLAG_NOT_ALLOWED' });
      const stored = await businesses.findById(businessId);
      expect(stored?.featureFlags).not.toContain('"ventasCredito":true');
    });

    it('always allows turning a key off, even one outside the set', async () => {
      const result = await useCase.execute({
        businessId,
        flagKey: 'merma',
        newValue: false,
        allowed,
      });
      expect(result.merma).toBe(false);
    });

    it('still enables a key inside the set', async () => {
      await useCase.execute({ businessId, flagKey: 'stock', newValue: false, allowed });
      const result = await useCase.execute({
        businessId,
        flagKey: 'stock',
        newValue: true,
        allowed,
      });
      expect(result.stock).toBe(true);
    });
  });

  it('raises typed errors, keeping the messages the phone already shows', async () => {
    await useCase.execute({ businessId, flagKey: 'stock', newValue: false });
    await expect(
      useCase.execute({ businessId, flagKey: 'merma', newValue: true }),
    ).rejects.toMatchObject({
      code: 'FLAG_DEPENDENCY',
      message: expect.stringMatching(/dependencia/),
    });
    await expect(
      useCase.execute({
        businessId: '01HZ8XQN9GZJXV8AKQ5X0ZZZZZ' as BusinessId,
        flagKey: 'stock',
        newValue: true,
      }),
    ).rejects.toMatchObject({
      code: 'BUSINESS_NOT_FOUND',
      message: expect.stringMatching(/no encontrado/),
    });
  });
});
