/**
 * useDirectorAlerts hook tests.
 * Phase 11 — Director Notification Inbox.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { InMemoryDirectorAlertsRepository, TEST_DEVICE_ID } from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useDirectorAlerts } from '../../src/hooks/use-director-alerts';
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

describe('useDirectorAlerts', () => {
  beforeEach(() => {
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('returns all alerts when filter is "all"', async () => {
    const repo = new InMemoryDirectorAlertsRepository(TEST_DEVICE_ID);
    const a1 = await repo.create({
      source: 'stock-bajo',
      severity: 'warning',
      titleKey: 'Stock bajo',
      message: 'Alert 1',
      actionRoute: null,
      businessId: BIZ,
    });
    await repo.create({
      source: 'caja-discrepancia',
      severity: 'warning',
      titleKey: 'Caja',
      message: 'Alert 2',
      actionRoute: null,
      businessId: BIZ,
    });
    await repo.markRead(a1.id);

    const { result } = renderHook(() => useDirectorAlerts('all'), {
      wrapper: wrapper({ directorAlerts: repo }),
    });

    await waitFor(() => expect(result.current.data).toHaveLength(2));
  });

  it('returns only unread alerts when filter is "unread"', async () => {
    const repo = new InMemoryDirectorAlertsRepository(TEST_DEVICE_ID);
    const a1 = await repo.create({
      source: 'stock-bajo',
      severity: 'warning',
      titleKey: 'Stock bajo',
      message: 'Alert 1',
      actionRoute: null,
      businessId: BIZ,
    });
    await repo.create({
      source: 'caja-discrepancia',
      severity: 'warning',
      titleKey: 'Caja',
      message: 'Alert 2',
      actionRoute: null,
      businessId: BIZ,
    });
    await repo.markRead(a1.id);

    const { result } = renderHook(() => useDirectorAlerts('unread'), {
      wrapper: wrapper({ directorAlerts: repo }),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0]!.source).toBe('caja-discrepancia');
    });
  });

  it('returns empty array when there are no alerts', async () => {
    const repo = new InMemoryDirectorAlertsRepository(TEST_DEVICE_ID);
    const { result } = renderHook(() => useDirectorAlerts(), {
      wrapper: wrapper({ directorAlerts: repo }),
    });

    await waitFor(() => expect(result.current.data).toEqual([]));
  });
});
