/**
 * PendientesDirectorCard tests (P1C-M10, S4-C7).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import type { BusinessId, DeviceId, IsoDate } from '@cachink/domain';
import {
  InMemoryExpensesRepository,
  InMemoryRecurringExpensesRepository,
  makeNewRecurringExpense,
} from '@cachink/testing';
import { PendientesDirectorCard } from '../../src/screens/DirectorHome/pendientes-director-card';
import { MockRepositoryProvider } from '@cachink/testing';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0BUSIN' as BusinessId;
const NOW = new Date('2026-04-15T12:00:00Z');

interface Harness {
  recurring: InMemoryRecurringExpensesRepository;
  expenses: InMemoryExpensesRepository;
}

function buildHarness(): Harness {
  return {
    recurring: new InMemoryRecurringExpensesRepository(DEV),
    expenses: new InMemoryExpensesRepository(DEV),
  };
}

function renderCard(harness: Harness): ReactElement {
  useAppConfigStore.getState().setCurrentBusinessId(BIZ);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });
  return (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider
        overrides={{
          recurringExpenses: harness.recurring,
          expenses: harness.expenses,
        }}
      >
        <PendientesDirectorCard now={NOW} />
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
}

describe('PendientesDirectorCard', () => {
  let harness: Harness;

  beforeEach(() => {
    harness = buildHarness();
  });

  afterEach(() => useAppConfigStore.getState().reset());

  it('returns null when there are no pendientes', async () => {
    renderWithProviders(renderCard(harness));
    await waitFor(() => {
      expect(screen.queryByTestId('pendientes-director-card')).toBeNull();
    });
  });

  it('renders the PendientesCard when a recurring expense is due today', async () => {
    await harness.recurring.create(
      makeNewRecurringExpense({
        businessId: BIZ,
        concepto: 'Renta mensual',
        proximoDisparo: '2026-04-15' as IsoDate,
        diaDelMes: 15,
      }),
    );
    renderWithProviders(renderCard(harness));
    await waitFor(() => {
      expect(screen.getByTestId('pendientes-director-card')).toBeInTheDocument();
    });
  });

  it('honors the `now` prop so tests are deterministic', async () => {
    // Pendiente seeded for 2026-05-15. With NOW=2026-04-15 it's not yet due.
    await harness.recurring.create(
      makeNewRecurringExpense({
        businessId: BIZ,
        concepto: 'Futuro',
        proximoDisparo: '2026-05-15' as IsoDate,
      }),
    );
    renderWithProviders(renderCard(harness));
    await waitFor(() => {
      expect(screen.queryByTestId('pendientes-director-card')).toBeNull();
    });
  });
});
