/**
 * useConversiones + useConversionRecetas tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useConversiones } from '../../src/hooks/use-conversiones';
import { useConversionRecetas } from '../../src/hooks/use-conversion-recetas';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function wrapper(overrides?: Record<string, unknown>) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={overrides}>
          {children}
        </MockRepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}

describe('useConversiones', () => {
  beforeEach(() => {
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('returns empty array when no conversions exist', async () => {
    const { result } = renderHook(() => useConversiones(), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('is disabled when no business is selected', () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useConversiones(), {
      wrapper: wrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useConversionRecetas', () => {
  beforeEach(() => {
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('returns empty array when no recipes exist', async () => {
    const { result } = renderHook(() => useConversionRecetas(), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('is disabled when no business is selected', () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useConversionRecetas(), {
      wrapper: wrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
