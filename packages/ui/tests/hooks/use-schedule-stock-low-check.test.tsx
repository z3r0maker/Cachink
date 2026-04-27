/**
 * useScheduleStockLowCheck tests (P1C-M11-T02, S4-C11).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import type { BusinessId, DeviceId } from '@cachink/domain';
import { InMemoryInventoryMovementsRepository, InMemoryProductsRepository } from '@cachink/testing';
import {
  InMemoryNotificationScheduler,
  useScheduleStockLowCheck,
  STOCK_LOW_NOTIFICATION_ID,
} from '../../src/index';
import { MockRepositoryProvider } from '@cachink/testing';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, waitFor } from '../test-utils';

initI18n();

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0BUSIN' as BusinessId;

interface Harness {
  products: InMemoryProductsRepository;
  movements: InMemoryInventoryMovementsRepository;
}

function seedLowStock(harness: Harness): Promise<unknown> {
  return harness.products.create({
    nombre: 'Producto bajo',
    categoria: 'Materia Prima',
    costoUnit: 100n as never,
    unidad: 'pza',
    umbralStockBajo: 10,
    businessId: BIZ,
  });
}

function Harnessed({
  enabled,
  scheduler,
}: {
  enabled: boolean;
  scheduler: InMemoryNotificationScheduler;
}): ReactElement {
  useScheduleStockLowCheck({ enabled, testScheduler: scheduler });
  return <div data-testid="harnessed" />;
}

function wrap(children: ReactNode, harness: Harness): ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });
  return (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider
        overrides={{
          products: harness.products,
          inventoryMovements: harness.movements,
        }}
      >
        {children}
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
}

describe('useScheduleStockLowCheck', () => {
  let harness: Harness;
  let scheduler: InMemoryNotificationScheduler;

  beforeEach(() => {
    harness = {
      products: new InMemoryProductsRepository(DEV),
      movements: new InMemoryInventoryMovementsRepository(DEV),
    };
    scheduler = new InMemoryNotificationScheduler();
    useAppConfigStore.getState().setCurrentBusinessId(BIZ);
    useAppConfigStore.getState().setRole('director');
  });

  afterEach(() => {
    useAppConfigStore.getState().reset();
  });

  it('does not schedule when role is not director', async () => {
    useAppConfigStore.getState().setRole('operativo');
    await seedLowStock(harness);
    renderWithProviders(wrap(<Harnessed enabled={true} scheduler={scheduler} />, harness));
    await waitFor(() => {
      expect(scheduler.scheduled.has(STOCK_LOW_NOTIFICATION_ID)).toBe(false);
    });
  });

  it('does not schedule when disabled', async () => {
    await seedLowStock(harness);
    renderWithProviders(wrap(<Harnessed enabled={false} scheduler={scheduler} />, harness));
    await waitFor(() => {
      expect(scheduler.scheduled.has(STOCK_LOW_NOTIFICATION_ID)).toBe(false);
    });
  });

  it('does not schedule when no productos are below umbral', async () => {
    renderWithProviders(wrap(<Harnessed enabled={true} scheduler={scheduler} />, harness));
    await waitFor(() => {
      expect(scheduler.scheduled.has(STOCK_LOW_NOTIFICATION_ID)).toBe(false);
    });
  });

  it('schedules a 19:00 daily trigger when director + stock is low', async () => {
    await seedLowStock(harness);
    renderWithProviders(wrap(<Harnessed enabled={true} scheduler={scheduler} />, harness));
    await waitFor(() => {
      const entry = scheduler.scheduled.get(STOCK_LOW_NOTIFICATION_ID);
      expect(entry?.hour).toBe(19);
      expect(entry?.minute).toBe(0);
    });
  });
});
