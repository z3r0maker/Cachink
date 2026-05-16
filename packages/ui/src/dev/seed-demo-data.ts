/**
 * seedDemoData — populates all repositories with realistic demo data.
 *
 * Inserts records through the existing repository interfaces (same code
 * path as production). Idempotent: checks `appConfig.__demo_seeded`.
 *
 * All PINs default to "000000" (both Director and Operativo).
 */

import { hash } from 'bcryptjs';
import type { BusinessId, DeviceId, Product } from '@cachink/domain';
import type { Repositories } from '../app/repository-provider';
import { demoProducts, demoClients, demoEmployees } from './demo-data-catalog';
import { seedSales, seedExpenses, seedRecurringExpenses } from './seed-transactions';
import { seedInventory, seedDayCloses, seedCajaTurnos } from './seed-operations';

const BCRYPT_ROUNDS = 10;
const DEFAULT_PIN = '000000';
const DEFAULT_RECOVERY = 'cachink123';
const DEMO_KEY = '__demo_seeded';

const ALL_FEATURES_ON = JSON.stringify({
  stock: true,
  conversionMateriaPrima: true,
  conversionAutomatica: false,
  auditoriaInventario: true,
  merma: true,
  ventasCredito: true,
});

export interface SeedDeps {
  readonly repositories: Repositories;
  readonly businessId: BusinessId;
  readonly deviceId: DeviceId;
}

export interface SeedResult {
  readonly totalRecords: number;
  readonly alreadySeeded: boolean;
}

export async function seedDemoData(deps: SeedDeps): Promise<SeedResult> {
  const { repositories: r, businessId: biz } = deps;

  // ── Idempotency guard ──────────────────────────────────────────────
  const existing = await r.appConfig.get(DEMO_KEY);
  if (existing === 'true') {
    return { totalRecords: 0, alreadySeeded: true };
  }

  let count = 0;

  // ── 1. Users (Director + Operativo, PIN 000000) ────────────────────
  const [pinHash, recoveryHash] = await Promise.all([
    hash(DEFAULT_PIN, BCRYPT_ROUNDS),
    hash(DEFAULT_RECOVERY, BCRYPT_ROUNDS),
  ]);

  const director = await r.users.create({
    nombre: 'Juan Director',
    email: null,
    pinHash,
    recoveryPasswordHash: recoveryHash,
    role: 'director',
    mustChangePin: false,
    avatarColor: 'blue',
    businessId: biz,
  });
  count += 1;

  const operativo = await r.users.create({
    nombre: 'Ana Operativa',
    email: null,
    pinHash,
    recoveryPasswordHash: recoveryHash,
    role: 'operativo',
    mustChangePin: false,
    avatarColor: 'green',
    businessId: biz,
  });
  count += 1;

  // ── 2. Products ────────────────────────────────────────────────────
  const products: Product[] = [];
  for (const np of demoProducts(biz)) {
    products.push(await r.products.create(np));
    count += 1;
  }

  // ── 3. Inventory, Clients, Employees ──────────────────────────────
  count += await seedInventory(r, biz, products);

  const clients = [];
  for (const nc of demoClients(biz)) {
    clients.push(await r.clients.create(nc));
    count += 1;
  }

  for (const ne of demoEmployees(biz)) {
    await r.employees.create(ne);
    count += 1;
  }

  // ── 4. Sales, Expenses, Recurring ──────────────────────────────────
  count += await seedSales(r, biz, products, clients);
  count += await seedExpenses(r, biz);
  count += await seedRecurringExpenses(r, biz);

  // ── 5. Day closes + Caja turnos ────────────────────────────────────
  count += await seedDayCloses(r, biz);
  count += await seedCajaTurnos(r, biz, director.id, operativo.id);

  // ── 6. Enable all feature flags ────────────────────────────────────
  await r.businesses.update(biz, { featureFlags: ALL_FEATURES_ON });

  // ── Mark as seeded ─────────────────────────────────────────────────
  await r.appConfig.set(DEMO_KEY, 'true');

  return { totalRecords: count, alreadySeeded: false };
}
