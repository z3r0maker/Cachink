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

export {
  MockRepositoryProvider,
  type MockRepositoryProviderProps,
} from './mock-repository-provider';

export { AppProviders, type AppProvidersProps } from './app-providers';
export { GatedNavigation, type GatedNavigationProps } from './gated-navigation';
