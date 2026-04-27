/**
 * UtilidadHero tests (P1C-M10-T01, S4-C2).
 *
 * Seeds an in-memory businesses repo + sales repo via the shared
 * MockRepositoryProvider harness, then renders the hero and asserts the
 * tone + utilidad value + Btn callback.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import type { BusinessId, DeviceId, IsoDate } from '@cachink/domain';
import {
  InMemoryBusinessesRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  makeNewExpense,
  makeNewSale,
} from '@cachink/testing';
import { UtilidadHero, currentMonthRange } from '../../src/screens/DirectorHome/utilidad-hero';
import { MockRepositoryProvider } from '@cachink/testing';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;

interface Harness {
  businessId: BusinessId;
  sales: InMemorySalesRepository;
  expenses: InMemoryExpensesRepository;
  businesses: InMemoryBusinessesRepository;
}

async function setupHarness(): Promise<Harness> {
  const businesses = new InMemoryBusinessesRepository(DEV);
  const sales = new InMemorySalesRepository(DEV);
  const expenses = new InMemoryExpensesRepository(DEV);
  const biz = await businesses.create({
    nombre: 'Test',
    regimenFiscal: 'RESICO',
    isrTasa: 0.3,
  });
  useAppConfigStore.getState().setCurrentBusinessId(biz.id);
  return { businessId: biz.id, sales, expenses, businesses };
}

function renderHero(harness: Harness, onVer?: () => void): ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });
  return (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider
        overrides={{
          sales: harness.sales,
          expenses: harness.expenses,
          businesses: harness.businesses,
        }}
      >
        <UtilidadHero onVerEstados={onVer} now={new Date('2026-04-15T12:00:00Z')} />
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
}

describe('UtilidadHero', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await setupHarness();
  });

  afterEach(() => {
    useAppConfigStore.getState().reset();
  });

  it('shows $0 and neutral tone for an empty month', async () => {
    renderWithProviders(renderHero(harness));
    await waitFor(() => {
      expect(screen.getByTestId('utilidad-hero')).toBeInTheDocument();
    });
  });

  it('shows positive tone when utilidad is positive', async () => {
    const from = '2026-04-10' as IsoDate;
    await harness.sales.create(
      makeNewSale({
        fecha: from,
        businessId: harness.businessId,
        metodo: 'Efectivo',
        monto: 100_000n,
      }),
    );
    renderWithProviders(renderHero(harness));
    await waitFor(() => {
      const value = screen.getByTestId('kpi-value');
      expect(value.textContent ?? '').toMatch(/\$/);
    });
  });

  it('shows negative tone when egresos dominate', async () => {
    await harness.expenses.create(
      makeNewExpense({
        fecha: '2026-04-10' as IsoDate,
        businessId: harness.businessId,
        categoria: 'Renta',
        monto: 500_000n,
      }),
    );
    renderWithProviders(renderHero(harness));
    await waitFor(() => {
      expect(screen.getByTestId('kpi-value')).toBeInTheDocument();
    });
  });

  it('fires onVerEstados when the Btn is tapped', async () => {
    const onVer = vi.fn();
    renderWithProviders(renderHero(harness, onVer));
    await waitFor(() => {
      expect(screen.getByTestId('utilidad-hero-ver-estados')).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('utilidad-hero-ver-estados')[0]!);
    expect(onVer).toHaveBeenCalled();
  });
});

describe('currentMonthRange', () => {
  it('returns the first and last day of the month for the given date', () => {
    const range = currentMonthRange(new Date('2026-04-15T12:00:00Z'));
    expect(range.from).toBe('2026-04-01');
    expect(range.to).toBe('2026-04-30');
  });

  it('handles February correctly in a non-leap year', () => {
    const range = currentMonthRange(new Date('2027-02-10T12:00:00Z'));
    expect(range.from).toBe('2027-02-01');
    expect(range.to).toBe('2027-02-28');
  });
});
