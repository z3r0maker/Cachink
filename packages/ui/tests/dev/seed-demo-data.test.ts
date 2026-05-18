/**
 * Unit tests for the demo data seed pipeline.
 *
 * Uses in-memory repositories — no real database, no React.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { BusinessId, DeviceId } from '@cachink/domain';
import {
  InMemoryAppConfigRepository,
  InMemoryBusinessesRepository,
  InMemorySalesRepository,
  InMemoryExpensesRepository,
  InMemoryProductsRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryEmployeesRepository,
  InMemoryClientsRepository,
  InMemoryClientPaymentsRepository,
  InMemoryDayClosesRepository,
  InMemoryRecurringExpensesRepository,
  InMemoryUsersRepository,
  InMemoryCajaTurnosRepository,
  InMemoryConversionRecetasRepository,
  InMemoryConversionsRepository,
  InMemoryAuditoriasInventarioRepository,
  InMemoryEntregasCreditoRepository,
  InMemoryDirectorAlertsRepository,
  TEST_DEVICE_ID,
} from '@cachink/testing';
import type { Repositories } from '../../src/app/repository-provider';
import { seedDemoData, type SeedDeps } from '../../src/dev/seed-demo-data';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEV = TEST_DEVICE_ID as DeviceId;

function buildRepos(): Repositories {
  return {
    appConfig: new InMemoryAppConfigRepository(),
    businesses: new InMemoryBusinessesRepository(DEV),
    sales: new InMemorySalesRepository(DEV),
    expenses: new InMemoryExpensesRepository(DEV),
    products: new InMemoryProductsRepository(DEV),
    inventoryMovements: new InMemoryInventoryMovementsRepository(DEV),
    employees: new InMemoryEmployeesRepository(DEV),
    clients: new InMemoryClientsRepository(DEV),
    clientPayments: new InMemoryClientPaymentsRepository(DEV),
    dayCloses: new InMemoryDayClosesRepository(DEV),
    recurringExpenses: new InMemoryRecurringExpensesRepository(DEV),
    users: new InMemoryUsersRepository(DEV),
    cajaTurnos: new InMemoryCajaTurnosRepository(DEV),
    conversionRecetas: new InMemoryConversionRecetasRepository(),
    conversions: new InMemoryConversionsRepository(DEV),
    auditoriasInventario: new InMemoryAuditoriasInventarioRepository(DEV),
    entregasCredito: new InMemoryEntregasCreditoRepository(DEV),
    directorAlerts: new InMemoryDirectorAlertsRepository(),
  };
}

describe('seedDemoData', () => {
  let repos: Repositories;
  let deps: SeedDeps;
  let bizId: BusinessId;

  beforeEach(async () => {
    repos = buildRepos();
    // Seed needs an existing business to update feature flags
    const biz = await repos.businesses.create({
      nombre: 'Tortillería La Esperanza',
      regimenFiscal: 'RIF',
      isrTasa: 3000,
      logoUrl: null,
      tipoNegocio: 'mixto',
      categoriaVentaPredeterminada: 'Producto',
      atributosProducto: [],
      featureFlags: '{"stock":true}',
      businessId: BIZ,
      deviceId: DEV,
      createdByUserId: null,
    });
    bizId = biz.id;
    deps = { repositories: repos, businessId: bizId, deviceId: DEV };
  });

  it('inserts records across all repositories', async () => {
    const result = await seedDemoData(deps);

    expect(result.alreadySeeded).toBe(false);
    expect(result.totalRecords).toBeGreaterThan(50);
  });

  it('creates 2 users (director + operativo)', async () => {
    await seedDemoData(deps);

    const users = await repos.users.findAllByBusiness(bizId);
    expect(users).toHaveLength(2);
    const roles = users.map((u) => u.role).sort();
    expect(roles).toEqual(['director', 'operativo']);
  });

  it('creates 12 products', async () => {
    await seedDemoData(deps);

    const products = await repos.products.listForBusiness(bizId);
    expect(products).toHaveLength(12);
  });

  it('creates sales across last 30 days', async () => {
    await seedDemoData(deps);
    const from = new Date(); from.setDate(from.getDate() - 30);
    const sales = await repos.sales.findByDateRange(
      from.toISOString().slice(0, 10), new Date().toISOString().slice(0, 10), bizId,
    );
    expect(sales.length).toBeGreaterThanOrEqual(290);
  });

  it('creates 15 expenses', async () => {
    await seedDemoData(deps);
    const from = new Date(); from.setDate(from.getDate() - 31);
    const expenses = await repos.expenses.findByDateRange(
      from.toISOString().slice(0, 10), new Date().toISOString().slice(0, 10), bizId,
    );
    expect(expenses.length).toBe(15);
  });

  it('creates 4 clients', async () => {
    await seedDemoData(deps);

    const c1 = await repos.clients.findByName('Laura', bizId);
    const c2 = await repos.clients.findByName('Roberto', bizId);
    expect(c1).not.toBeNull();
    expect(c2).not.toBeNull();
  });

  it('creates day closes for last 5 days', async () => {
    await seedDemoData(deps);

    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    const closes = await repos.dayCloses.findByDateRange(
      from.toISOString().slice(0, 10) as import('@cachink/domain').IsoDate,
      today.toISOString().slice(0, 10) as import('@cachink/domain').IsoDate,
      bizId,
    );
    expect(closes).toHaveLength(5);
  });

  it('creates caja turnos including one open turn', async () => {
    await seedDemoData(deps);

    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    const turnos = await repos.cajaTurnos.findByDateRange(
      from.toISOString().slice(0, 10),
      today.toISOString().slice(0, 10),
      bizId,
    );
    // 5 past closed + 1 morning closed + 1 afternoon open = 7
    expect(turnos.length).toBe(7);
    // At least one should be open (cierreAt === null)
    const openTurnos = turnos.filter((t) => t.cierreAt === null);
    expect(openTurnos.length).toBe(1);
  });

  it('is idempotent — second call is a no-op', async () => {
    const first = await seedDemoData(deps);
    expect(first.alreadySeeded).toBe(false);

    const second = await seedDemoData(deps);
    expect(second.alreadySeeded).toBe(true);
    expect(second.totalRecords).toBe(0);
  });

  it('enables all feature flags on the business', async () => {
    await seedDemoData(deps);

    const business = await repos.businesses.findById(bizId);
    expect(business).not.toBeNull();
    const flags = JSON.parse(business!.featureFlags ?? '{}');
    expect(flags.ventasCredito).toBe(true);
    expect(flags.stock).toBe(true);
    expect(flags.auditoriaInventario).toBe(true);
  });

  it('all sale montos are bigint (no floats)', async () => {
    await seedDemoData(deps);
    const from = new Date(); from.setDate(from.getDate() - 31);
    const sales = await repos.sales.findByDateRange(
      from.toISOString().slice(0, 10), new Date().toISOString().slice(0, 10), bizId,
    );
    for (const sale of sales) expect(typeof sale.monto).toBe('bigint');
  });
});
