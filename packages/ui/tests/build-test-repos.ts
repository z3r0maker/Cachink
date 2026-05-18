/**
 * Shared test helper — builds a full `Repositories` record from
 * in-memory implementations without going through MockRepositoryProvider.
 *
 * Avoids the transitive `@cachink/observability` import that blocks
 * Vitest when using `@cachink/testing/ui`'s MockRepositoryProvider.
 */

import {
  InMemoryAppConfigRepository,
  InMemoryBusinessesRepository,
  InMemoryClientPaymentsRepository,
  InMemoryClientsRepository,
  InMemoryDayClosesRepository,
  InMemoryEmployeesRepository,
  InMemoryExpensesRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  InMemoryRecurringExpensesRepository,
  InMemorySalesRepository,
  InMemoryUsersRepository,
  InMemoryCajaTurnosRepository,
  InMemoryConversionRecetasRepository,
  InMemoryConversionsRepository,
  InMemoryAuditoriasInventarioRepository,
  InMemoryEntregasCreditoRepository,
  InMemoryDirectorAlertsRepository,
  InMemoryCajaMovimientosRepository,
  InMemoryCancelacionLogsRepository,
} from '@cachink/testing';
import type { Repositories } from '../src/app/repository-provider';

/**
 * Build a complete `Repositories` record with optional overrides.
 * Unspecified keys get fresh empty in-memory instances.
 */
export function buildTestRepos(overrides?: Partial<Repositories>): Repositories {
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
    users: new InMemoryUsersRepository(),
    cajaTurnos: new InMemoryCajaTurnosRepository(),
    conversionRecetas: new InMemoryConversionRecetasRepository(),
    conversions: new InMemoryConversionsRepository(),
    auditoriasInventario: new InMemoryAuditoriasInventarioRepository(),
    entregasCredito: new InMemoryEntregasCreditoRepository(),
    directorAlerts: new InMemoryDirectorAlertsRepository(),
    cajaMovimientos: new InMemoryCajaMovimientosRepository(),
    cancelacionLogs: new InMemoryCancelacionLogsRepository(),
    ...overrides,
  };
}
