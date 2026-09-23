import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { EmployeeSchema, InventoryMovementSchema, ProductSchema } from '@xangarro/domain';

import { createDb, withBusiness, type Db } from '../src/client.js';
import { listProductos } from '../src/queries/lists.js';
import { periodBalanceInputs } from '../src/queries/balance.js';
import { inventoryMovements, products } from '../src/schema/catalog.js';
import { employees } from '../src/schema/tenant.js';
import { integrationSuite } from './support/db';

/**
 * Seeded rows must satisfy the domain schemas that describe them.
 *
 * Nothing checked this, and the seed had drifted far enough to be a trap. Ids
 * were short readable strings — `p-tac`, `s1` — where `ProductSchema` requires
 * a 26-character ULID (ADR-010), and `tipo` was `'Producto'` where the enum is
 * `'producto'`. Postgres accepted both: ids are `text`, and Drizzle's
 * `text(..., { enum })` is a TypeScript type, not a CHECK constraint.
 *
 * It stayed invisible because **no read path validates**. The portal's queries
 * project columns straight into React, so a row that could never pass
 * `ProductSchema` rendered perfectly. It surfaced the moment the first *write*
 * ran `EditarProductoUseCase`, which parses before it persists — a defect found
 * by a feature rather than by a test, which is the wrong order.
 *
 * This is that test.
 */
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const { url, describe } = integrationSuite();

describe('the seed satisfies the domain schemas', () => {
  let db: Db;

  beforeAll(() => {
    db = createDb(url as string);
  });

  afterAll(async () => {
    await db.$client.end({ timeout: 5 });
  });

  it('every seeded product parses as a domain Product', async () => {
    const rows = await withBusiness(db, BIZ, (tx) => tx.select().from(products));
    assert.ok(rows.length > 0, 'the seed must have run — start with `pnpm db:reset`');

    const failures: string[] = [];
    for (const row of rows) {
      const candidate = {
        ...row,
        atributos: JSON.parse(row.atributos) as Record<string, string>,
        createdAt: new Date(row.createdAt).toISOString(),
        updatedAt: new Date(row.updatedAt).toISOString(),
        deletedAt: row.deletedAt === null ? null : new Date(row.deletedAt).toISOString(),
      };
      const parsed = ProductSchema.safeParse(candidate);
      if (!parsed.success) {
        const paths = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
        failures.push(`${row.id}: ${paths}`);
      }
    }

    assert.deepEqual(
      failures,
      [],
      `${failures.length} seeded product(s) cannot pass ProductSchema:\n` +
        `${failures.map((f) => `  ${f}`).join('\n')}\n\n` +
        'Seed data that the domain rejects is not a fixture, it is a trap: every ' +
        'read renders it happily and the first write fails.',
    );
  });

  it('every seeded employee parses as a domain Employee', async () => {
    // Added after `periodo` turned out to be `'Semanal'` against an enum of
    // `'semanal'` — the same defect as `tipo`, in a table the products check
    // did not cover. A guard that only watches the table where the bug was
    // first found is not a guard.
    const rows = await withBusiness(db, BIZ, (tx) => tx.select().from(employees));
    assert.ok(rows.length > 0, 'the seed must have run');

    const failures = rows
      .map((row) => ({
        id: row.id,
        parsed: EmployeeSchema.safeParse({
          ...row,
          createdAt: new Date(row.createdAt).toISOString(),
          updatedAt: new Date(row.updatedAt).toISOString(),
          deletedAt: row.deletedAt === null ? null : new Date(row.deletedAt).toISOString(),
        }),
      }))
      .filter((r) => !r.parsed.success)
      .map((r) => `${r.id}: ${r.parsed.error?.issues.map((i) => i.path.join('.')).join(', ')}`);

    assert.deepEqual(failures, []);
  });

  it('every seeded movement parses as a domain InventoryMovement', async () => {
    // Added when movements joined the bootstrap (ADR-081): the seed's
    // `'Compra'` is not an entry reason, so the first activation that sent
    // movements failed its own response check.
    const rows = await withBusiness(db, BIZ, (tx) => tx.select().from(inventoryMovements));
    assert.ok(rows.length > 0, 'the seed must have run');
    const failures = rows
      .map((row) => ({
        id: row.id,
        parsed: InventoryMovementSchema.safeParse({
          ...row,
          createdAt: new Date(row.createdAt).toISOString(),
          updatedAt: new Date(row.updatedAt).toISOString(),
          deletedAt: row.deletedAt === null ? null : new Date(row.deletedAt).toISOString(),
        }),
      }))
      .filter((r) => !r.parsed.success)
      .map((r) => `${r.id}: ${r.parsed.error?.issues.map((i) => i.path.join('.')).join(', ')}`);
    assert.deepEqual(failures, []);
  });

  it('no seeded producto has sold more than it ever stocked', async () => {
    // The seed's month generator wrote a `salida` per ticket and never a
    // restocking `entrada`: two months of ventas ran against six fixture
    // compras, four of six productos netted negative, and the Balance's
    // Inventarios line read −$3,353.90. The domain now floors the valuation
    // at zero per producto (ADR-095) — which is exactly why this assertion
    // has to live here too. A clamp that hides a broken fixture is not a
    // guard; the fixture must be arithmetically possible on its own.
    const { stock } = await withBusiness(db, BIZ, (tx) =>
      periodBalanceInputs(tx, '2026-01-01', '2099-12-31'),
    );
    assert.ok(stock.length > 0, 'the seed must have run — start with `pnpm db:reset`');

    const negativos = stock.filter((s) => s.cantidad < 0);
    assert.deepEqual(
      negativos.map((s) => `${s.costoUnitCentavos} centavos/u → ${s.cantidad} u`),
      [],
      'a producto cannot sell units it never bought — `seed-finanzas-stock.ts` ' +
        'restocks each week from what that week sold.',
    );
  });

  it('ids are ULIDs, not readable shorthand', async () => {
    // Called out separately because it is the failure that is easiest to
    // reintroduce — a readable id is far more convenient to type into a test.
    const rows = await withBusiness(db, BIZ, (tx) => listProductos(tx));
    const notUlid = rows.map((r) => r.id).filter((id) => !/^[0-9A-HJKMNP-TV-Z]{26}$/.test(id));
    assert.deepEqual(notUlid, [], 'ids are minted on the device as ULIDs (ADR-010)');
  });
});
