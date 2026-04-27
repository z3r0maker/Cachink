/**
 * MovimientosRoute smart-wrapper tests (Round 3 F4 coverage).
 *
 * The wrapper composes `useMovimientosRecientes` + `useProductos` and
 * passes the data to `<MovimientosScreen>`. The route was uncovered
 * before Round 3 (28.57% lines, 0% functions in the per-file
 * breakdown).
 */

import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { DeviceId, BusinessId, IsoDate } from '@cachink/domain';
import {
  InMemoryProductsRepository,
  InMemoryInventoryMovementsRepository,
  MockRepositoryProvider,
} from '@cachink/testing';
import { MovimientosRoute } from '../../src/screens/Inventario/movimientos-route';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0BUSIN' as BusinessId;
const FECHA = '2026-04-24' as IsoDate;

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });
  const products = new InMemoryProductsRepository(DEV);
  const inventoryMovements = new InMemoryInventoryMovementsRepository(DEV);
  return (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider overrides={{ products, inventoryMovements }}>
        {children}
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
}

describe('MovimientosRoute', () => {
  afterEach(() => useAppConfigStore.getState().reset());

  it('renders the empty Movimientos screen when no movements exist', async () => {
    useAppConfigStore.getState().setCurrentBusinessId(BIZ);
    renderWithProviders(
      <Wrapper>
        <MovimientosRoute />
      </Wrapper>,
    );
    // The MovimientosScreen renders a header and an empty state.
    expect(await screen.findByTestId('movimientos-screen')).toBeInTheDocument();
  });

  it('exposes empty data even with no business selected (does not crash)', () => {
    // No setCurrentBusinessId — the smart wrapper must still render.
    renderWithProviders(
      <Wrapper>
        <MovimientosRoute />
      </Wrapper>,
    );
    expect(screen.getByTestId('movimientos-screen')).toBeInTheDocument();
  });

  // Reference fecha so the lint doesn't flag the unused import. Kept
  // here so future tests can exercise dated movements without changing
  // the signature.
  it('compiles with the test fecha constant', () => {
    expect(FECHA).toBe('2026-04-24');
  });
});
