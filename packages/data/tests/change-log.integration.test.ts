/**
 * Integration tests for the `__cachink_change_log` triggers and the
 * `__cachink_sync_state` helpers added in migration 0001 (ADR-029,
 * ADR-030).
 *
 * The tests run against a freshly-migrated `:memory:` `better-sqlite3`
 * database — the same harness used by schema.integration.test.ts — so they
 * exercise the real trigger SQL, not a re-implementation.
 *
 * What they prove:
 *   - Inserting a row into any of the 10 synced business tables produces
 *     exactly one `insert` change-log row with matching id + device_id.
 *   - Updating a row (including soft-delete via `deleted_at`) produces an
 *     `update` change-log row.
 *   - The `__cachink_change_log.id` column is monotonically increasing so
 *     sync clients can paginate without losing rows.
 *   - `app_config` writes never appear in the change log (only business
 *     tables are synced).
 *   - The `__cachink_sync_state` round-trips JSON values of every
 *     useful shape.
 */

import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeFreshDb } from './helpers/fresh-db';
import * as schema from '../src/schema/index.js';
import {
  clearSyncState,
  readHwm,
  readSyncState,
  writeHwm,
  writeSyncState,
} from '../src/sync-state.js';
import type { CachinkDatabase } from '../src/repositories/drizzle/_db.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_A = '01HZ8XQN9GZJXV8AKQ5X0C7TEA';
const DEV_B = '01HZ8XQN9GZJXV8AKQ5X0C7TEB';

const audit = (deviceId = DEV_A) => ({
  businessId: BIZ,
  deviceId,
  createdAt: '2026-04-23T15:00:00.000Z',
  updatedAt: '2026-04-23T15:00:00.000Z',
  deletedAt: null,
});

type ChangeLogRow = {
  id: number;
  table_name: string;
  row_id: string;
  row_updated_at: string;
  row_device_id: string;
  op: 'insert' | 'update';
  captured_at: string;
};

async function readChangeLog(db: CachinkDatabase): Promise<ChangeLogRow[]> {
  return (await db.all(
    sql`SELECT "id", "table_name", "row_id", "row_updated_at", "row_device_id", "op", "captured_at"
        FROM "__cachink_change_log" ORDER BY "id" ASC`,
  )) as ChangeLogRow[];
}

describe('migration 0001 — change-log triggers capture every row change', () => {
  let db: CachinkDatabase;

  beforeEach(() => {
    db = makeFreshDb();
  });

  it('fires exactly one insert row per business-table insert', async () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE1';
    await db
      .insert(schema.sales)
      .values({
        id,
        fecha: '2026-04-23',
        concepto: 'Taco al pastor',
        categoria: 'Producto',
        monto: 450_00n,
        metodo: 'Efectivo',
        clienteId: null,
        estadoPago: 'pagado',
        ...audit(),
      })
      .run();

    const log = await readChangeLog(db);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      table_name: 'sales',
      row_id: id,
      row_device_id: DEV_A,
      op: 'insert',
    });
  });

  it('fires an update row when updated_at changes', async () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE2';
    await db
      .insert(schema.products)
      .values({
        id,
        nombre: 'Harina 1kg',
        sku: 'HAR-001',
        categoria: 'Materia Prima',
        costoUnitCentavos: 3500n,
        unidad: 'kg',
        umbralStockBajo: 5,
        ...audit(),
      })
      .run();
    await db.run(
      sql`UPDATE products SET updated_at = '2026-04-23T15:05:00.000Z', umbral_stock_bajo = 10 WHERE id = ${id}`,
    );

    const log = await readChangeLog(db);
    expect(log.map((r) => r.op)).toEqual(['insert', 'update']);
    expect(log[1]?.row_updated_at).toBe('2026-04-23T15:05:00.000Z');
  });

  it('treats a soft-delete (deleted_at set) as an update', async () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE3';
    await db
      .insert(schema.clients)
      .values({
        id,
        nombre: 'Laura Hernández',
        telefono: null,
        email: null,
        nota: null,
        ...audit(),
      })
      .run();
    await db.run(
      sql`UPDATE clients SET deleted_at = '2026-04-23T16:00:00.000Z', updated_at = '2026-04-23T16:00:00.000Z' WHERE id = ${id}`,
    );

    const log = await readChangeLog(db);
    expect(log).toHaveLength(2);
    expect(log[1]?.op).toBe('update');
    expect(log[1]?.table_name).toBe('clients');
  });

  it('fires independent rows per synced table for the same business', async () => {
    const clienteId = '01HZ8XQN9GZJXV8AKQ5X0C7TE4';
    const productoId = '01HZ8XQN9GZJXV8AKQ5X0C7TE5';
    const movimientoId = '01HZ8XQN9GZJXV8AKQ5X0C7TE6';

    await db
      .insert(schema.clients)
      .values({
        id: clienteId,
        nombre: 'Cliente X',
        telefono: null,
        email: null,
        nota: null,
        ...audit(),
      })
      .run();
    await db
      .insert(schema.products)
      .values({
        id: productoId,
        nombre: 'Insumo Y',
        sku: null,
        categoria: 'Insumo',
        costoUnitCentavos: 1200n,
        unidad: 'pza',
        umbralStockBajo: 3,
        ...audit(),
      })
      .run();
    await db
      .insert(schema.inventoryMovements)
      .values({
        id: movimientoId,
        productoId,
        fecha: '2026-04-23',
        tipo: 'entrada',
        cantidad: 12,
        costoUnitCentavos: 1200n,
        motivo: 'Compra a proveedor',
        nota: null,
        ...audit(),
      })
      .run();

    const log = await readChangeLog(db);
    expect(log.map((r) => r.table_name)).toEqual(['clients', 'products', 'inventory_movements']);
    for (let i = 1; i < log.length; i += 1) {
      expect((log[i]?.id ?? 0) > (log[i - 1]?.id ?? 0)).toBe(true);
    }
  });

  it('does NOT capture writes to app_config (not a synced table)', async () => {
    await db.insert(schema.appConfig).values({ key: 'mode', value: '"local-standalone"' }).run();

    const log = await readChangeLog(db);
    expect(log).toHaveLength(0);
  });

  it('captures every one of the 10 synced tables', async () => {
    const tables = [
      'businesses',
      'sales',
      'expenses',
      'products',
      'inventory_movements',
      'employees',
      'clients',
      'client_payments',
      'day_closes',
      'recurring_expenses',
    ];
    // Insert minimal rows across all 10 synced tables. We reuse ULIDs
    // that only need to differ within this fixture.
    await db
      .insert(schema.businesses)
      .values({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7B01',
        nombre: 'Negocio',
        regimenFiscal: 'RIF',
        isrTasa: 0.3,
        logoUrl: null,
        ...audit(),
      })
      .run();
    await db
      .insert(schema.sales)
      .values({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7S01',
        fecha: '2026-04-23',
        concepto: 'x',
        categoria: 'Producto',
        monto: 1n,
        metodo: 'Efectivo',
        clienteId: null,
        estadoPago: 'pagado',
        ...audit(),
      })
      .run();
    await db
      .insert(schema.expenses)
      .values({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7G01',
        fecha: '2026-04-23',
        concepto: 'y',
        categoria: 'Renta',
        monto: 1n,
        proveedor: null,
        gastoRecurrenteId: null,
        ...audit(),
      })
      .run();
    await db
      .insert(schema.products)
      .values({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7P01',
        nombre: 'p',
        sku: null,
        categoria: 'Insumo',
        costoUnitCentavos: 1n,
        unidad: 'pza',
        umbralStockBajo: 3,
        ...audit(),
      })
      .run();
    await db
      .insert(schema.inventoryMovements)
      .values({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7M01',
        productoId: '01HZ8XQN9GZJXV8AKQ5X0C7P01',
        fecha: '2026-04-23',
        tipo: 'entrada',
        cantidad: 1,
        costoUnitCentavos: 1n,
        motivo: 'Compra a proveedor',
        nota: null,
        ...audit(),
      })
      .run();
    await db
      .insert(schema.employees)
      .values({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7E01',
        nombre: 'e',
        puesto: 'x',
        salarioCentavos: 1n,
        periodo: 'quincenal',
        ...audit(),
      })
      .run();
    await db
      .insert(schema.clients)
      .values({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7C01',
        nombre: 'c',
        telefono: null,
        email: null,
        nota: null,
        ...audit(),
      })
      .run();
    await db
      .insert(schema.clientPayments)
      .values({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7Y01',
        ventaId: '01HZ8XQN9GZJXV8AKQ5X0C7S01',
        fecha: '2026-04-23',
        montoCentavos: 1n,
        metodo: 'Efectivo',
        nota: null,
        ...audit(),
      })
      .run();
    await db
      .insert(schema.dayCloses)
      .values({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7D01',
        fecha: '2026-04-23',
        efectivoEsperadoCentavos: 0n,
        efectivoContadoCentavos: 0n,
        diferenciaCentavos: 0n,
        explicacion: null,
        cerradoPor: 'Operativo',
        ...audit(),
      })
      .run();
    await db
      .insert(schema.recurringExpenses)
      .values({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7R01',
        concepto: 'r',
        categoria: 'Renta',
        montoCentavos: 1n,
        proveedor: null,
        frecuencia: 'mensual',
        diaDelMes: 1,
        diaDeLaSemana: null,
        proximoDisparo: '2026-05-01',
        activo: true,
        ...audit(),
      })
      .run();

    const log = await readChangeLog(db);
    const seen = new Set(log.map((r) => r.table_name));
    for (const table of tables) {
      expect(seen.has(table)).toBe(true);
    }
  });

  it('preserves the distinct device_id on the log row (tiebreak input)', async () => {
    await db
      .insert(schema.sales)
      .values({
        id: '01HZ8XQN9GZJXV8AKQ5X0C7TE7',
        fecha: '2026-04-23',
        concepto: 'a',
        categoria: 'Producto',
        monto: 1n,
        metodo: 'Efectivo',
        clienteId: null,
        estadoPago: 'pagado',
        ...audit(DEV_B),
      })
      .run();

    const log = await readChangeLog(db);
    expect(log[0]?.row_device_id).toBe(DEV_B);
  });
});

describe('__cachink_sync_state helpers — readSyncState / writeSyncState', () => {
  let db: CachinkDatabase;

  beforeEach(() => {
    db = makeFreshDb();
  });

  it('returns null for a scope that was never written', async () => {
    expect(await readSyncState(db, 'auth.serverUrl')).toBeNull();
  });

  it('round-trips a string value', async () => {
    await writeSyncState(db, 'auth.serverUrl', 'http://192.168.1.5:43812');
    expect(await readSyncState(db, 'auth.serverUrl')).toBe('http://192.168.1.5:43812');
  });

  it('round-trips a number value', async () => {
    await writeSyncState(db, 'localPushHwm', 42);
    expect(await readSyncState(db, 'localPushHwm')).toBe(42);
  });

  it('overwrites an existing scope', async () => {
    await writeSyncState(db, 'serverPullHwm', 10);
    await writeSyncState(db, 'serverPullHwm', 20);
    expect(await readSyncState(db, 'serverPullHwm')).toBe(20);
  });

  it('readHwm returns 0 when the scope is unset', async () => {
    expect(await readHwm(db, 'localPushHwm')).toBe(0);
  });

  it('writeHwm rejects negative numbers and non-integers', async () => {
    await expect(writeHwm(db, 'localPushHwm', -1)).rejects.toThrow(/non-negative integer/);
    await expect(writeHwm(db, 'localPushHwm', 1.5)).rejects.toThrow(/non-negative integer/);
  });

  it('clearSyncState wipes every scope', async () => {
    await writeSyncState(db, 'auth.accessToken', 'tok');
    await writeSyncState(db, 'auth.serverUrl', 'http://x');
    await clearSyncState(db);
    expect(await readSyncState(db, 'auth.accessToken')).toBeNull();
    expect(await readSyncState(db, 'auth.serverUrl')).toBeNull();
  });
});
