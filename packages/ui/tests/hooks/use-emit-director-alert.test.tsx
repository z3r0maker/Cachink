/**
 * useEmitDirectorAlert hook tests.
 * Phase 11 — Director Notification Inbox.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { InMemoryDirectorAlertsRepository, TEST_DEVICE_ID } from '@cachink/testing';
import type { BusinessId } from '@cachink/domain';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useEmitDirectorAlert } from '../../src/hooks/use-emit-director-alert';
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

describe('useEmitDirectorAlert', () => {
  beforeEach(() => {
    useAppConfigStore.setState({
      currentBusinessId: BIZ,
      hydrated: true,
    });
  });

  it('creates an alert via the repository', async () => {
    const repo = new InMemoryDirectorAlertsRepository(TEST_DEVICE_ID);
    const { result } = renderHook(() => useEmitDirectorAlert(), {
      wrapper: wrapper({ directorAlerts: repo }),
    });

    await act(async () => {
      result.current.mutate({
        source: 'stock-bajo',
        severity: 'warning',
        titleKey: 'notificaciones.stockBajo',
        message: 'Test alert message',
        actionRoute: '/productos',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const alerts = await repo.findAll(BIZ);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.source).toBe('stock-bajo');
    expect(alerts[0]!.severity).toBe('warning');
  });

  it('skips duplicate alerts when dedupeKey matches', async () => {
    const repo = new InMemoryDirectorAlertsRepository(TEST_DEVICE_ID);
    // Seed an existing unread alert with matching source + metadata
    await repo.create({
      source: 'stock-bajo',
      severity: 'warning',
      titleKey: 'notificaciones.stockBajo',
      message: 'Existing alert',
      actionRoute: '/productos',
      metadata: JSON.stringify({ productoId: 'prod-123' }),
      businessId: BIZ,
    });

    const { result } = renderHook(() => useEmitDirectorAlert(), {
      wrapper: wrapper({ directorAlerts: repo }),
    });

    await act(async () => {
      result.current.mutate({
        source: 'stock-bajo',
        severity: 'warning',
        titleKey: 'notificaciones.stockBajo',
        message: 'Duplicate',
        actionRoute: '/productos',
        dedupeKey: 'prod-123',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const alerts = await repo.findAll(BIZ);
    // Should still be 1, not 2
    expect(alerts).toHaveLength(1);
  });

  it('returns null when no businessId is set', async () => {
    useAppConfigStore.setState({ currentBusinessId: null });
    const { result } = renderHook(() => useEmitDirectorAlert(), {
      wrapper: wrapper(),
    });

    await act(async () => {
      result.current.mutate({
        source: 'stock-bajo',
        severity: 'warning',
        titleKey: 'test',
        message: 'test',
        actionRoute: null,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
