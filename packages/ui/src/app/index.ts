/**
 * Public surface of `@xangarro/ui/app` — the composition root primitives
 * both apps wire in their shell.
 */

export {
  RepositoryProvider,
  buildDrizzleRepositories,
  useRepositories,
  useAppConfigRepository,
  useBusinessesRepository,
  useSalesRepository,
  useTicketsRepository,
  useExpensesRepository,
  useProductsRepository,
  useInventoryMovementsRepository,
  useEmployeesRepository,
  useClientsRepository,
  useClientPaymentsRepository,
  useDayClosesRepository,
  useRecurringExpensesRepository,
  useUsersRepository,
  useCajaTurnosRepository,
  useConversionRecetasRepository,
  useConversionsRepository,
  useAuditoriasInventarioRepository,
  useEntregasCreditoRepository,
  useDirectorAlertsRepository,
  useCajaMovimientosRepository,
  useCancelacionLogsRepository,
  type Repositories,
  type RepositoryProviderProps,
} from './repository-provider';

// MockRepositoryProvider moved to `@xangarro/testing` in ADR-033 — it was
// test-only code inside a runtime package. Test suites that need it now
// import from `@xangarro/testing`.

export { AppProviders, type AppProvidersProps, type AppProvidersHooks } from './app-providers';
export { GatedNavigation, type GatedNavigationProps, type LanBridges } from './gated-navigation';
export { LanGate, type LanGateProps } from './lan-gate';
export { AppErrorBoundary, type AppErrorBoundaryProps } from './error-boundary';
export { AppLoadingSkeleton, type AppLoadingSkeletonProps } from './app-loading-skeleton';
