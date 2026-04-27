/**
 * Public surface of `@cachink/ui/app` — the composition root primitives
 * both apps wire in their shell.
 */

export {
  RepositoryProvider,
  buildDrizzleRepositories,
  useRepositories,
  useAppConfigRepository,
  useBusinessesRepository,
  useSalesRepository,
  useExpensesRepository,
  useProductsRepository,
  useInventoryMovementsRepository,
  useEmployeesRepository,
  useClientsRepository,
  useClientPaymentsRepository,
  useDayClosesRepository,
  useRecurringExpensesRepository,
  type Repositories,
  type RepositoryProviderProps,
} from './repository-provider';

// MockRepositoryProvider moved to `@cachink/testing` in ADR-033 — it was
// test-only code inside a runtime package. Test suites that need it now
// import from `@cachink/testing`.

export { AppProviders, type AppProvidersProps, type AppProvidersHooks } from './app-providers';
export {
  GatedNavigation,
  type GatedNavigationProps,
  type LanBridges,
  type CloudBridges,
} from './gated-navigation';
export { LanGate, type LanGateProps } from './lan-gate';
export { CloudGate, type CloudGateProps } from './cloud-gate';
export { AppErrorBoundary, type AppErrorBoundaryProps } from './error-boundary';
