/**
 * useFeatureFlags / useFeatureFlag hook tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import {
  InMemoryBusinessesRepository,
  TEST_DEVICE_ID,
} from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { DEFAULT_FEATURE_FLAGS } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useFeatureFlags, useFeatureFlag } from '../../src/hooks/use-feature-flags';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(
  overrides?: Record<string, unknown>,
): (props: { children: ReactNode }) => ReactNode {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <QueryClientProvider client={qc}>
          <MockRepositoryProvider overrides={overrides}>
            {children}
          </MockRepositoryProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    );
  };
}

describe('useFeatureFlags', () => {
  beforeEach(() => {
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('returns DEFAULT_FEATURE_FLAGS when no business is loaded yet', () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useFeatureFlags(), {
      wrapper: wrapper(),
    });
    expect(result.current).toEqual(DEFAULT_FEATURE_FLAGS);
  });

  it('parses flags from the business record', async () => {
    const businesses = new InMemoryBusinessesRepository(TEST_DEVICE_ID);
    const flags = { ...DEFAULT_FEATURE_FLAGS, caja: true, merma: true };
    const biz = await businesses.create({
      nombre: 'Test',
      regimenFiscal: 'RIF',
      isrTasa: 0.3,
      businessId: BIZ,
      featureFlags: JSON.stringify(flags),
    });
    useAppConfigStore.setState({ currentBusinessId: biz.id });

    const { result } = renderHook(() => useFeatureFlags(), {
      wrapper: wrapper({ businesses }),
    });

    await waitFor(() => {
      expect(result.current.caja).toBe(true);
      expect(result.current.merma).toBe(true);
    });
  });
});

describe('useFeatureFlag', () => {
  beforeEach(() => {
    useAppConfigStore.setState({ currentBusinessId: null, hydrated: true });
  });

  it('returns stock as true by default', () => {
    const { result } = renderHook(() => useFeatureFlag('stock'), {
      wrapper: wrapper(),
    });
    expect(result.current).toBe(true);
  });

  it('returns caja as false by default', () => {
    const { result } = renderHook(() => useFeatureFlag('caja'), {
      wrapper: wrapper(),
    });
    expect(result.current).toBe(false);
  });
});
