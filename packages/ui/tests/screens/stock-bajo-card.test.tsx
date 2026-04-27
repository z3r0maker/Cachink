/**
 * StockBajoCard tests (P1C-M10-T05, S4-C6).
 */

import { afterEach, describe, expect, it } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import type { BusinessId, DeviceId } from '@cachink/domain';
import { InMemoryInventoryMovementsRepository, InMemoryProductsRepository } from '@cachink/testing';
import { StockBajoCard } from '../../src/screens/DirectorHome/stock-bajo-card';
import { MockRepositoryProvider } from '@cachink/testing';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0BUSIN' as BusinessId;

function renderCard(
  products: InMemoryProductsRepository,
  movements: InMemoryInventoryMovementsRepository,
): ReactElement {
  useAppConfigStore.getState().setCurrentBusinessId(BIZ);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });
  return (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider overrides={{ products, inventoryMovements: movements }}>
        <StockBajoCard />
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
}

describe('StockBajoCard', () => {
  afterEach(() => useAppConfigStore.getState().reset());

  it('renders null when no products are below umbral', async () => {
    const products = new InMemoryProductsRepository(DEV);
    const movements = new InMemoryInventoryMovementsRepository(DEV);
    const { container } = renderWithProviders(renderCard(products, movements));
    await waitFor(() => {
      expect(screen.queryByTestId('stock-bajo-card')).toBeNull();
    });
    expect(container).toBeInTheDocument();
  });

  it('renders the summary card when at least one producto is below umbral', async () => {
    const products = new InMemoryProductsRepository(DEV);
    const movements = new InMemoryInventoryMovementsRepository(DEV);
    await products.create({
      nombre: 'Producto Bajo',
      categoria: 'Materia Prima',
      costoUnit: 100n as never,
      unidad: 'pza',
      umbralStockBajo: 10,
      businessId: BIZ,
    });
    renderWithProviders(renderCard(products, movements));
    await waitFor(() => {
      expect(screen.getByTestId('stock-bajo-card')).toBeInTheDocument();
    });
  });
});
