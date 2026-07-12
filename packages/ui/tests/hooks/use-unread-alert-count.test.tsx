/**
 * useUnreadAlertCount hook tests.
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
import { useUnreadAlertCount } from '../../src/hooks/use-unread-alert-count';
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

describe('useUnreadAlertCount', () => {
  beforeEach(() => {
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('returns 0 when there are no alerts', async () => {
    const repo = new InMemoryDirectorAlertsRepository(TEST_DEVICE_ID);
    const { result } = renderHook(() => useUnreadAlertCount(), {
      wrapper: wrapper({ directorAlerts: repo }),
    });

    await waitFor(() => expect(result.current.data).toBe(0));
  });

  it('returns the count of unread alerts', async () => {
    const repo = new InMemoryDirectorAlertsRepository(TEST_DEVICE_ID);
    await repo.create({
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

    const { result } = renderHook(() => useUnreadAlertCount(), {
      wrapper: wrapper({ directorAlerts: repo }),
    });

    await waitFor(() => expect(result.current.data).toBe(2));
  });

  it('excludes read alerts from the count', async () => {
    const repo = new InMemoryDirectorAlertsRepository(TEST_DEVICE_ID);
    const alert = await repo.create({
      source: 'stock-bajo',
      severity: 'warning',
      titleKey: 'Stock bajo',
      message: 'Alert 1',
      actionRoute: null,
      businessId: BIZ,
    });
    await repo.markRead(alert.id);

    const { result } = renderHook(() => useUnreadAlertCount(), {
      wrapper: wrapper({ directorAlerts: repo }),
    });

    await waitFor(() => expect(result.current.data).toBe(0));
  });

  it('excludes unread alerts for disabled feature flags from the count', async () => {
    const repo = new InMemoryDirectorAlertsRepository(TEST_DEVICE_ID);
    // stock-bajo passes (stock ON by default)
    await repo.create({
      source: 'stock-bajo',
      severity: 'warning',
      titleKey: 'Stock bajo',
      message: 'Stock alert',
      actionRoute: null,
      businessId: BIZ,
    });
    // merma-threshold blocked (merma OFF / MVP-hidden)
    await repo.create({
      source: 'merma-threshold',
      severity: 'warning',
      titleKey: 'Merma',
      message: 'Merma alert',
      actionRoute: null,
      businessId: BIZ,
    });

    const { result } = renderHook(() => useUnreadAlertCount(), {
      wrapper: wrapper({ directorAlerts: repo }),
    });

    // Only 1 counted — merma-threshold excluded by flag filter
    await waitFor(() => expect(result.current.data).toBe(1));
  });
});
