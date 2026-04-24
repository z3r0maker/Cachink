/**
 * RepositoryProvider — composition root for the 11 Cachink repositories.
 *
 * CLAUDE.md §4.3 mandates constructor-injected repository interfaces for
 * use-cases. The app-level composition happens here: each app's
 * `AppProviders` wraps children in `RepositoryProvider` with one concrete
 * implementation per repo. Screens + hooks pull repos via the
 * `useXRepository` accessors instead of constructing their own — keeping
 * the dependency graph testable.
 *
 * Two variants ship:
 *   - `RepositoryProvider`: production. Takes a pre-built `Repositories`
 *     record (the `DrizzleRepositoryBridge` in `./app-providers` builds
 *     one from the DB + deviceId).
 *   - `buildDrizzleRepositories(db, deviceId)`: pure factory that produces
 *     a full `Repositories` record wired onto the Drizzle implementations.
 *
 * Tests use the same `RepositoryProvider` but pass a record built from
 * `@cachink/testing` in-memory impls.
 */

import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import type { DeviceId } from '@cachink/domain';
import type {
  AppConfigRepository,
  BusinessesRepository,
  CachinkDatabase,
  ClientPaymentsRepository,
  ClientsRepository,
  DayClosesRepository,
  EmployeesRepository,
  ExpensesRepository,
  InventoryMovementsRepository,
  ProductsRepository,
  RecurringExpensesRepository,
  SalesRepository,
} from '@cachink/data';
import {
  DrizzleAppConfigRepository,
  DrizzleBusinessesRepository,
  DrizzleClientPaymentsRepository,
  DrizzleClientsRepository,
  DrizzleDayClosesRepository,
  DrizzleEmployeesRepository,
  DrizzleExpensesRepository,
  DrizzleInventoryMovementsRepository,
  DrizzleProductsRepository,
  DrizzleRecurringExpensesRepository,
  DrizzleSalesRepository,
} from '@cachink/data';

/**
 * Full set of repositories the app depends on. Every screen, hook, and
 * use-case wires through this record — never directly on a Drizzle class
 * so tests can substitute in-memory doubles.
 */
export interface Repositories {
  readonly appConfig: AppConfigRepository;
  readonly businesses: BusinessesRepository;
  readonly sales: SalesRepository;
  readonly expenses: ExpensesRepository;
  readonly products: ProductsRepository;
  readonly inventoryMovements: InventoryMovementsRepository;
  readonly employees: EmployeesRepository;
  readonly clients: ClientsRepository;
  readonly clientPayments: ClientPaymentsRepository;
  readonly dayCloses: DayClosesRepository;
  readonly recurringExpenses: RecurringExpensesRepository;
}

const RepositoryContext = createContext<Repositories | null>(null);

/** Factory: wire every Drizzle repository onto a DB + deviceId in one call. */
export function buildDrizzleRepositories(db: CachinkDatabase, deviceId: DeviceId): Repositories {
  return {
    appConfig: new DrizzleAppConfigRepository(db),
    businesses: new DrizzleBusinessesRepository(db, deviceId),
    sales: new DrizzleSalesRepository(db, deviceId),
    expenses: new DrizzleExpensesRepository(db, deviceId),
    products: new DrizzleProductsRepository(db, deviceId),
    inventoryMovements: new DrizzleInventoryMovementsRepository(db, deviceId),
    employees: new DrizzleEmployeesRepository(db, deviceId),
    clients: new DrizzleClientsRepository(db, deviceId),
    clientPayments: new DrizzleClientPaymentsRepository(db, deviceId),
    dayCloses: new DrizzleDayClosesRepository(db, deviceId),
    recurringExpenses: new DrizzleRecurringExpensesRepository(db, deviceId),
  };
}

export interface RepositoryProviderProps {
  readonly children: ReactNode;
  readonly repositories: Repositories;
}

export function RepositoryProvider(props: RepositoryProviderProps): ReactElement {
  return (
    <RepositoryContext.Provider value={props.repositories}>
      {props.children}
    </RepositoryContext.Provider>
  );
}

/**
 * Read the repository record from context. Throws with a call-site-level
 * message rather than letting downstream `.salesRepository` access crash
 * with a generic null-pointer.
 */
export function useRepositories(): Repositories {
  const repos = useContext(RepositoryContext);
  if (!repos) {
    throw new Error(
      'useRepositories() / useXRepository() must be called inside a ' +
        '<RepositoryProvider>. Check that <AppProviders> or ' +
        '<MockRepositoryProvider> wraps the component under test.',
    );
  }
  return repos;
}

export const useAppConfigRepository = (): AppConfigRepository => useRepositories().appConfig;
export const useBusinessesRepository = (): BusinessesRepository => useRepositories().businesses;
export const useSalesRepository = (): SalesRepository => useRepositories().sales;
export const useExpensesRepository = (): ExpensesRepository => useRepositories().expenses;
export const useProductsRepository = (): ProductsRepository => useRepositories().products;
export const useInventoryMovementsRepository = (): InventoryMovementsRepository =>
  useRepositories().inventoryMovements;
export const useEmployeesRepository = (): EmployeesRepository => useRepositories().employees;
export const useClientsRepository = (): ClientsRepository => useRepositories().clients;
export const useClientPaymentsRepository = (): ClientPaymentsRepository =>
  useRepositories().clientPayments;
export const useDayClosesRepository = (): DayClosesRepository => useRepositories().dayCloses;
export const useRecurringExpensesRepository = (): RecurringExpensesRepository =>
  useRepositories().recurringExpenses;
