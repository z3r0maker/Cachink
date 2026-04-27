/**
 * Test-only MockRepositoryProvider — one-liner for component tests that
 * need a valid repository context but don't care about persistence.
 *
 * The in-memory repository implementations in this package are
 * contract-tested against the same interface as the Drizzle ones, so
 * screens render identically whether they talk to SQLite or RAM.
 * Default instantiation here means a test can just write:
 *
 *   renderWithProviders(
 *     <MockRepositoryProvider>
 *       <NuevaVentaModal ... />
 *     </MockRepositoryProvider>
 *   );
 *
 * Pass `overrides` to seed specific repos with pre-populated instances
 * (e.g. a ClientsRepository with one fixture client for the Crédito
 * path). Unspecified keys fall back to fresh empty in-memory instances.
 *
 * Lives in `@cachink/testing` (not `@cachink/ui`) per ADR-033 so that
 * test-only code never enters the runtime import graph of either app.
 */

import { useMemo, type ReactElement, type ReactNode } from 'react';
import { RepositoryProvider, type Repositories } from '@cachink/ui';
import { InMemoryAppConfigRepository } from './in-memory-app-config-repository.js';
import { InMemoryBusinessesRepository } from './in-memory-businesses-repository.js';
import { InMemoryClientPaymentsRepository } from './in-memory-client-payments-repository.js';
import { InMemoryClientsRepository } from './in-memory-clients-repository.js';
import { InMemoryDayClosesRepository } from './in-memory-day-closes-repository.js';
import { InMemoryEmployeesRepository } from './in-memory-employees-repository.js';
import { InMemoryExpensesRepository } from './in-memory-expenses-repository.js';
import { InMemoryInventoryMovementsRepository } from './in-memory-inventory-movements-repository.js';
import { InMemoryProductsRepository } from './in-memory-products-repository.js';
import { InMemoryRecurringExpensesRepository } from './in-memory-recurring-expenses-repository.js';
import { InMemorySalesRepository } from './in-memory-sales-repository.js';

export interface MockRepositoryProviderProps {
  readonly children: ReactNode;
  /**
   * Any subset of repositories to override. Unspecified keys get fresh
   * in-memory instances. Pass an empty `{}` or omit entirely to get the
   * all-default set.
   */
  readonly overrides?: Partial<Repositories>;
}

/** Default-empty in-memory repositories for component tests. */
function buildInMemoryRepositories(): Repositories {
  return {
    appConfig: new InMemoryAppConfigRepository(),
    businesses: new InMemoryBusinessesRepository(),
    sales: new InMemorySalesRepository(),
    expenses: new InMemoryExpensesRepository(),
    products: new InMemoryProductsRepository(),
    inventoryMovements: new InMemoryInventoryMovementsRepository(),
    employees: new InMemoryEmployeesRepository(),
    clients: new InMemoryClientsRepository(),
    clientPayments: new InMemoryClientPaymentsRepository(),
    dayCloses: new InMemoryDayClosesRepository(),
    recurringExpenses: new InMemoryRecurringExpensesRepository(),
  };
}

export function MockRepositoryProvider(props: MockRepositoryProviderProps): ReactElement {
  const repositories = useMemo<Repositories>(
    () => ({ ...buildInMemoryRepositories(), ...props.overrides }),
    [props.overrides],
  );
  return <RepositoryProvider repositories={repositories}>{props.children}</RepositoryProvider>;
}
