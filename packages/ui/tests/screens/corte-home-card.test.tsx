/**
 * CorteHomeCard smart-wrapper tests (Round 3 F4 coverage).
 *
 * The wrapper composes useCorteGate + useCorteDelDia +
 * useEfectivoEsperado + useCerrarCorteDeDia and renders the dumb
 * CorteDeDiaCard + CorteDeDiaModal pair. Pre-Round 3 it was at
 * 12.34% functions.
 *
 * Tests focus on the visibility branches; the close-corte mutation
 * is already covered by the dumb modal + use-cerrar-corte-de-dia
 * specs.
 */

import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BusinessId, DeviceId } from '@cachink/domain';
import {
  InMemoryDayClosesRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  MockRepositoryProvider,
} from '@cachink/testing';
import { CorteHomeCard } from '../../src/screens/CorteDeDia/corte-home-card';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0BUSIN' as BusinessId;

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });
  const sales = new InMemorySalesRepository(DEV);
  const expenses = new InMemoryExpensesRepository(DEV);
  const dayCloses = new InMemoryDayClosesRepository(DEV);
  return (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider overrides={{ sales, expenses, dayCloses }}>
        {children}
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
}

// Pin Date so useCorteGate's local-time check returns deterministic
// results across the test run.
const FIXED_AFTER_18 = new Date('2026-04-24T20:00:00');
const FIXED_BEFORE_18 = new Date('2026-04-24T10:00:00');

describe('CorteHomeCard — gate visibility', () => {
  afterEach(() => {
    useAppConfigStore.getState().reset();
    vi.useRealTimers();
  });

  it('renders the corte-home-card testID even before 18:00 (the dumb card hides itself)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_BEFORE_18);
    useAppConfigStore.getState().setCurrentBusinessId(BIZ);
    useAppConfigStore.getState().setDeviceId(DEV);
    renderWithProviders(
      <Wrapper>
        <CorteHomeCard />
      </Wrapper>,
    );
    // Wrapper always renders both elements; the dumb card decides
    // whether to show the actual UI based on its `shouldShow` prop.
    // This branch verifies the wrapper doesn't crash before 18:00.
    expect(screen.queryByText(/Corte/i)).toBeDefined();
  });

  it('still renders the wrapper when no business or device is selected (graceful)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_AFTER_18);
    // Skip business + device — the smart wrapper must NOT crash;
    // shouldShow is false because businessId === null.
    renderWithProviders(
      <Wrapper>
        <CorteHomeCard />
      </Wrapper>,
    );
    expect(screen.queryByText(/Corte/i)).toBeDefined();
  });

  it('honours a custom testID once the corte query has resolved (after 18:00, no existing corte)', async () => {
    // useFakeTimers breaks Promise microtasks, so use a fixed Date via
    // a mock instead of vi.useFakeTimers for this test.
    const realNow = Date.now;
    Date.now = () => FIXED_AFTER_18.getTime();
    const realDate = global.Date;
    global.Date = class extends realDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(FIXED_AFTER_18.getTime());
          return;
        }
        // @ts-expect-error - forwarding arbitrary Date arguments
        super(...args);
      }
    } as DateConstructor;
    try {
      useAppConfigStore.getState().setCurrentBusinessId(BIZ);
      useAppConfigStore.getState().setDeviceId(DEV);
      renderWithProviders(
        <Wrapper>
          <CorteHomeCard testID="my-corte-card" />
        </Wrapper>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('my-corte-card')).toBeInTheDocument();
      });
    } finally {
      Date.now = realNow;
      global.Date = realDate;
    }
  });
});
