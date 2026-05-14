/**
 * RepositoryProvider — composition root for the 18 Cachink repositories.
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
import type { DeviceId, UserId } from '@cachink/domain';
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
  UsersRepository,
  CajaTurnosRepository,
  ConversionRecetasRepository,
  ConversionsRepository,
  AuditoriasInventarioRepository,
  EntregasCreditoRepository,
  DirectorAlertsRepository,
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
  DrizzleUsersRepository,
  DrizzleCajaTurnosRepository,
  DrizzleConversionRecetasRepository,
  DrizzleConversionsRepository,
  DrizzleAuditoriasInventarioRepository,
  DrizzleEntregasCreditoRepository,
  DrizzleDirectorAlertsRepository,
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
  readonly users: UsersRepository;
  readonly cajaTurnos: CajaTurnosRepository;
  readonly conversionRecetas: ConversionRecetasRepository;
  readonly conversions: ConversionsRepository;
  readonly auditoriasInventario: AuditoriasInventarioRepository;
  readonly entregasCredito: EntregasCreditoRepository;
  readonly directorAlerts: DirectorAlertsRepository;
}

const RepositoryContext = createContext<Repositories | null>(null);

/**
 * Factory: wire every Drizzle repository onto a DB + deviceId + userId.
 * `userId` is optional (null before login) — repos stamp it on created rows.
 */
export function buildDrizzleRepositories(
  db: CachinkDatabase,
  deviceId: DeviceId,
  userId?: UserId | null,
): Repositories {
  const uid = userId ?? null;
  return {
    appConfig: new DrizzleAppConfigRepository(db),
    businesses: new DrizzleBusinessesRepository(db, deviceId, uid),
    sales: new DrizzleSalesRepository(db, deviceId, uid),
    expenses: new DrizzleExpensesRepository(db, deviceId, uid),
    products: new DrizzleProductsRepository(db, deviceId, uid),
    inventoryMovements: new DrizzleInventoryMovementsRepository(db, deviceId, uid),
    employees: new DrizzleEmployeesRepository(db, deviceId, uid),
    clients: new DrizzleClientsRepository(db, deviceId, uid),
    clientPayments: new DrizzleClientPaymentsRepository(db, deviceId, uid),
    dayCloses: new DrizzleDayClosesRepository(db, deviceId, uid),
    recurringExpenses: new DrizzleRecurringExpensesRepository(db, deviceId, uid),
    users: new DrizzleUsersRepository(db, deviceId, uid),
    cajaTurnos: new DrizzleCajaTurnosRepository(db, deviceId, uid),
    conversionRecetas: new DrizzleConversionRecetasRepository(db, deviceId, uid),
    conversions: new DrizzleConversionsRepository(db, deviceId, uid),
    auditoriasInventario: new DrizzleAuditoriasInventarioRepository(db, deviceId, uid),
    entregasCredito: new DrizzleEntregasCreditoRepository(db, deviceId, uid),
    directorAlerts: new DrizzleDirectorAlertsRepository(db, deviceId, uid),
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
export const useUsersRepository = (): UsersRepository => useRepositories().users;
export const useCajaTurnosRepository = (): CajaTurnosRepository => useRepositories().cajaTurnos;
export const useConversionRecetasRepository = (): ConversionRecetasRepository =>
  useRepositories().conversionRecetas;
export const useConversionsRepository = (): ConversionsRepository => useRepositories().conversions;
export const useAuditoriasInventarioRepository = (): AuditoriasInventarioRepository =>
  useRepositories().auditoriasInventario;
export const useEntregasCreditoRepository = (): EntregasCreditoRepository =>
  useRepositories().entregasCredito;
export const useDirectorAlertsRepository = (): DirectorAlertsRepository =>
  useRepositories().directorAlerts;
