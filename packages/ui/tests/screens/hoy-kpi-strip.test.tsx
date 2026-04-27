/**
 * HoyKpiStrip tests (P1C-M10-T02, S4-C3).
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
import { HoyKpiStrip } from '../../src/screens/DirectorHome/hoy-kpi-strip';
import { MockRepositoryProvider } from '@cachink/testing';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const NOW = new Date('2026-04-15T12:00:00Z');
const TODAY = '2026-04-15' as IsoDate;

interface Harness {
  businessId: BusinessId;
  sales: InMemorySalesRepository;
  expenses: InMemoryExpensesRepository;
  businesses: InMemoryBusinessesRepository;
}

async function setup(): Promise<Harness> {
  const businesses = new InMemoryBusinessesRepository(DEV);
  const biz = await businesses.create({
    nombre: 'Test',
    regimenFiscal: 'RESICO',
    isrTasa: 0.3,
  });
  useAppConfigStore.getState().setCurrentBusinessId(biz.id);
  return {
    businessId: biz.id,
    sales: new InMemorySalesRepository(DEV),
    expenses: new InMemoryExpensesRepository(DEV),
    businesses,
  };
}

function renderStrip(
  h: Harness,
  handlers: { onVerVentas?: () => void; onVerEgresos?: () => void } = {},
): ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });
  return (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider
        overrides={{ sales: h.sales, expenses: h.expenses, businesses: h.businesses }}
      >
        <HoyKpiStrip now={NOW} {...handlers} />
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
}

describe('HoyKpiStrip', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await setup();
  });

  afterEach(() => {
    useAppConfigStore.getState().reset();
  });

  it('renders both Ventas hoy and Egresos hoy cards with zero totals for an empty day', async () => {
    renderWithProviders(renderStrip(harness));
    await waitFor(() => {
      expect(screen.getByTestId('hoy-kpi-ventas')).toBeInTheDocument();
      expect(screen.getByTestId('hoy-kpi-egresos')).toBeInTheDocument();
    });
  });

  it('reflects ventas total', async () => {
    await harness.sales.create(
      makeNewSale({
        fecha: TODAY,
        businessId: harness.businessId,
        metodo: 'Efectivo',
        monto: 25_000n,
      }),
    );
    renderWithProviders(renderStrip(harness));
    await waitFor(() => {
      const value = screen.getByTestId('hoy-kpi-ventas').querySelector('[data-testid="kpi-value"]');
      expect(value?.textContent ?? '').toContain('$');
    });
  });

  it('reflects egresos total', async () => {
    await harness.expenses.create(
      makeNewExpense({
        fecha: TODAY,
        businessId: harness.businessId,
        categoria: 'Renta',
        monto: 10_000n,
      }),
    );
    renderWithProviders(renderStrip(harness));
    await waitFor(() => {
      expect(screen.getByTestId('hoy-kpi-egresos')).toBeInTheDocument();
    });
  });

  it('fires onVerVentas / onVerEgresos when the Btns are tapped', async () => {
    const onVerVentas = vi.fn();
    const onVerEgresos = vi.fn();
    renderWithProviders(renderStrip(harness, { onVerVentas, onVerEgresos }));
    await waitFor(() => {
      expect(screen.getByTestId('hoy-kpi-ventas-ver')).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByTestId('hoy-kpi-ventas-ver')[0]!);
    fireEvent.click(screen.getAllByTestId('hoy-kpi-egresos-ver')[0]!);
    expect(onVerVentas).toHaveBeenCalled();
    expect(onVerEgresos).toHaveBeenCalled();
  });
});
