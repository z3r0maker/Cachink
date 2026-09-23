/**
 * useFeatureFlags / useFeatureFlag (A-14): platform × verified plan × tenant.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import {
  InMemoryAppConfigRepository,
  InMemoryBusinessesRepository,
  TEST_DEVICE_ID,
  seedTestEntitlement,
  signTestPayload,
  signedTestEntitlement,
} from '@xangarro/testing';
import {
  DEFAULT_FEATURE_FLAGS,
  type BusinessId,
  type Entitlement,
  type PlanId,
} from '@xangarro/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useFeatureFlag, useFeatureFlags } from '../../src/hooks/use-feature-flags';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(overrides: Record<string, unknown>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={overrides}>{children}</MockRepositoryProvider>
      </QueryClientProvider>
    );
  };
}

async function setup(opts: { plan?: PlanId; tenant?: Partial<typeof DEFAULT_FEATURE_FLAGS> }) {
  const appConfig = new InMemoryAppConfigRepository();
  if (opts.plan) await seedTestEntitlement(appConfig, opts.plan);
  return setupWith(appConfig, opts.tenant ?? {});
}

/** Store a signed payload with fresh sync clocks, as a pull would. */
async function seedSignedPayload(appConfig: InMemoryAppConfigRepository, payload: Entitlement) {
  const now = new Date().toISOString();
  await appConfig.set('entitlement', JSON.stringify(signTestPayload(payload)));
  await appConfig.set('lastServerTime', now);
  await appConfig.set('lastPullAt', now);
}

async function setupWith(
  appConfig: InMemoryAppConfigRepository,
  tenant: Partial<typeof DEFAULT_FEATURE_FLAGS>,
) {
  const opts = { tenant };
  const businesses = new InMemoryBusinessesRepository(TEST_DEVICE_ID);
  const biz = await businesses.create({
    nombre: 'Test',
    regimenFiscal: 'RIF',
    isrTasa: 3000,
    businessId: BIZ,
    featureFlags: JSON.stringify({ ...DEFAULT_FEATURE_FLAGS, ...opts.tenant }),
  });
  useAppConfigStore.setState({ currentBusinessId: biz.id, hydrated: true });
  return wrapper({ appConfig, businesses });
}

describe('useFeatureFlags', () => {
  beforeEach(() => {
    useAppConfigStore.setState({ currentBusinessId: null, hydrated: true });
  });

  it('keeps plan features off without a verified entitlement (Xangarrito)', async () => {
    const { result } = renderHook(() => useFeatureFlags(), { wrapper: await setup({}) });
    await waitFor(() => expect(result.current.stock).toBe(false));
    expect(result.current.barcode).toBe(false);
  });

  it('turns stock and barcode on for an Xangarro entitlement', async () => {
    const { result } = renderHook(() => useFeatureFlags(), {
      wrapper: await setup({ plan: 'xangarro' }),
    });
    await waitFor(() => expect(result.current.stock).toBe(true));
    expect(result.current.barcode).toBe(true);
  });

  it('respects a tenant toggle the portal turned off, even on a plan that includes it', async () => {
    const { result } = renderHook(() => useFeatureFlags(), {
      wrapper: await setup({ plan: 'xangarro', tenant: { stock: false } }),
    });
    await waitFor(() => expect(result.current.barcode).toBe(true));
    expect(result.current.stock).toBe(false);
  });

  it('keeps platform-dark features off on the top plan', async () => {
    const { result } = renderHook(() => useFeatureFlags(), {
      wrapper: await setup({
        plan: 'xangarrote',
        tenant: { merma: true, auditoriaInventario: true, ventasCredito: true },
      }),
    });
    await waitFor(() => expect(result.current.stock).toBe(true));
    expect(result.current.merma).toBe(false);
    expect(result.current.auditoriaInventario).toBe(false);
    expect(result.current.ventasCredito).toBe(false);
  });
});

describe('useFeatureFlag', () => {
  it('reads one effective flag', async () => {
    const { result } = renderHook(() => useFeatureFlag('stock'), {
      wrapper: await setup({ plan: 'xangarro' }),
    });
    await waitFor(() => expect(result.current).toBe(true));
  });
});

describe('platform availability from the signed entitlement (N-09)', () => {
  it('lights a feature staff released even though the compiled default is dark', async () => {
    const appConfig = new InMemoryAppConfigRepository();
    const { payload } = signedTestEntitlement('xangarrote');
    await seedSignedPayload(appConfig, { ...payload, features: [...payload.features, 'merma'] });
    const { result } = renderHook(() => useFeatureFlags(), {
      wrapper: await setupWith(appConfig, { merma: true }),
    });
    await waitFor(() => expect(result.current.merma).toBe(true));
  });

  it('darkens a feature staff switched off even though the plan includes it', async () => {
    const appConfig = new InMemoryAppConfigRepository();
    const { payload } = signedTestEntitlement('xangarro');
    await seedSignedPayload(appConfig, {
      ...payload,
      features: payload.features.filter((k) => k !== 'stock'),
    });
    const { result } = renderHook(() => useFeatureFlags(), {
      wrapper: await setupWith(appConfig, {}),
    });
    await waitFor(() => expect(result.current.barcode).toBe(true));
    expect(result.current.stock).toBe(false);
  });
});
