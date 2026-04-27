/**
 * NuevoEgresoModalSmart tests — Slice 9.5 T01.
 *
 * The smart wrapper owns the 3 tab bodies + all mutation hooks. This
 * spec asserts the route-to-UI wiring the Round 2 audit found missing:
 * mounting the smart modal with `open` renders the real tabs instead
 * of the `<PlaceholderBody>` debug stubs, the Nómina empty-state +
 * Inventario onCrearProducto paths reach the expected callback, and
 * the blank-business-id branch falls back to the dumb modal without
 * crashing.
 *
 * Form submission paths are already covered at the GastoTab /
 * InventarioTab / NominaTab level; this spec only verifies that the
 * smart wrapper correctly substitutes the real tab bodies for the
 * render-prop slots the Round 1 + Round 2 routes were missing.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import type { BusinessId, DeviceId, IsoDate } from '@cachink/domain';
import {
  InMemoryExpensesRepository,
  InMemoryRecurringExpensesRepository,
  MockRepositoryProvider,
} from '@cachink/testing';
import { NuevoEgresoModalSmart } from '../../src/screens/index';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0BUSIN' as BusinessId;
const FECHA = '2026-04-24' as IsoDate;

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });
  const expenses = new InMemoryExpensesRepository(DEV);
  const recurring = new InMemoryRecurringExpensesRepository(DEV);
  return (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider overrides={{ expenses, recurringExpenses: recurring }}>
        {children}
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
}

describe('NuevoEgresoModalSmart', () => {
  afterEach(() => useAppConfigStore.getState().reset());

  it('renders the real gasto tab body (not the placeholder stub)', () => {
    useAppConfigStore.getState().setCurrentBusinessId(BIZ);
    renderWithProviders(
      <Wrapper>
        <NuevoEgresoModalSmart open onClose={() => {}} fecha={FECHA} />
      </Wrapper>,
    );
    expect(screen.queryByTestId('egreso-tab-body-gasto')).toBeNull();
    expect(screen.getByTestId('gasto-concepto')).toBeInTheDocument();
    expect(screen.getByTestId('gasto-categoria')).toBeInTheDocument();
    expect(screen.getAllByTestId('gasto-submit')[0]).toBeInTheDocument();
  });

  it('renders the real nómina tab when initialTab=nomina', () => {
    useAppConfigStore.getState().setCurrentBusinessId(BIZ);
    renderWithProviders(
      <Wrapper>
        <NuevoEgresoModalSmart open onClose={() => {}} fecha={FECHA} initialTab="nomina" />
      </Wrapper>,
    );
    // Empty empleados list shows the "Crear empleado" Btn from NominaTab.
    expect(screen.getByTestId('nomina-crear-empleado')).toBeInTheDocument();
  });

  it('wires onCrearProducto through to the InventarioTab empty state', () => {
    useAppConfigStore.getState().setCurrentBusinessId(BIZ);
    const onCrearProducto = vi.fn();
    renderWithProviders(
      <Wrapper>
        <NuevoEgresoModalSmart
          open
          onClose={() => {}}
          fecha={FECHA}
          initialTab="inventario"
          onCrearProducto={onCrearProducto}
        />
      </Wrapper>,
    );
    const btn = screen.getAllByTestId('inventario-crear-producto')[0]!;
    fireEvent.click(btn);
    expect(onCrearProducto).toHaveBeenCalled();
  });

  it('falls back to the placeholder modal when no business is selected', () => {
    // Intentionally skip setCurrentBusinessId — the wrapper must NOT crash
    // and must render the dumb modal so the shell stays responsive.
    renderWithProviders(
      <Wrapper>
        <NuevoEgresoModalSmart open onClose={() => {}} fecha={FECHA} />
      </Wrapper>,
    );
    expect(screen.getByTestId('egreso-tab-body-gasto')).toBeInTheDocument();
    expect(screen.queryByTestId('gasto-concepto')).toBeNull();
  });
});
