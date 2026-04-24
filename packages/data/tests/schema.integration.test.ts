/**
 * Integration test for the Drizzle SQLite schema (P1B-M3-T04).
 *
 * Runs the generated migration against an in-memory SQLite via
 * `better-sqlite3`, then round-trips one row through every Phase 1 table.
 * Proves:
 *   - The migration SQL applies cleanly.
 *   - Every sqliteTable type-checks against a concrete insert.
 *   - Money stored as `numeric(..., { mode: 'bigint' })` preserves
 *     bigint precision end-to-end (CLAUDE.md §2 principle 8).
 *   - Boolean columns (`recurring_expenses.activo`) round-trip as TS
 *     `boolean` via Drizzle's `{ mode: 'boolean' }` mapping.
 *
 * The app runtime uses `expo-sqlite` / `@tauri-apps/plugin-sql`; this test
 * only validates the schema shape.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '../src/schema/index.js';

type DB = BetterSQLite3Database<typeof schema>;

function freshDb(): DB {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './drizzle/migrations' });
  return db;
}

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';

const audit = {
  businessId: BIZ,
  deviceId: DEV,
  createdAt: '2026-04-23T15:00:00.000Z',
  updatedAt: '2026-04-23T15:00:00.000Z',
  deletedAt: null,
};

describe('Drizzle schema — migration applies to fresh :memory: DB', () => {
  let db: DB;

  beforeEach(() => {
    db = freshDb();
  });

  it('creates every table empty and queryable', () => {
    expect(db.select().from(schema.businesses).all()).toEqual([]);
    expect(db.select().from(schema.appConfig).all()).toEqual([]);
    expect(db.select().from(schema.sales).all()).toEqual([]);
    expect(db.select().from(schema.expenses).all()).toEqual([]);
    expect(db.select().from(schema.products).all()).toEqual([]);
    expect(db.select().from(schema.inventoryMovements).all()).toEqual([]);
    expect(db.select().from(schema.employees).all()).toEqual([]);
    expect(db.select().from(schema.clients).all()).toEqual([]);
    expect(db.select().from(schema.clientPayments).all()).toEqual([]);
    expect(db.select().from(schema.dayCloses).all()).toEqual([]);
    expect(db.select().from(schema.recurringExpenses).all()).toEqual([]);
  });
});

describe('Drizzle schema — round-trip every entity', () => {
  let db: DB;

  beforeEach(() => {
    db = freshDb();
  });

  it('round-trips a Business row', () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE0';
    db.insert(schema.businesses)
      .values({
        id,
        nombre: 'Tortillería La Esperanza',
        regimenFiscal: 'RIF',
        isrTasa: 0.3,
        logoUrl: null,
        ...audit,
      })
      .run();
    const [row] = db.select().from(schema.businesses).where(eq(schema.businesses.id, id)).all();
    expect(row?.nombre).toBe('Tortillería La Esperanza');
    expect(row?.isrTasa).toBeCloseTo(0.3, 10);
  });

  it('round-trips an AppConfig key/value pair', () => {
    db.insert(schema.appConfig).values({ key: 'mode', value: '"local-standalone"' }).run();
    const [row] = db.select().from(schema.appConfig).all();
    expect(row?.value).toBe('"local-standalone"');
  });

  it('round-trips a Sale preserving bigint money', () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE1';
    db.insert(schema.sales)
      .values({
        id,
        fecha: '2026-04-23',
        concepto: 'Taco al pastor',
        categoria: 'Producto',
        monto: 450_00n,
        metodo: 'Efectivo',
        clienteId: null,
        estadoPago: 'pagado',
        ...audit,
      })
      .run();
    const [row] = db.select().from(schema.sales).where(eq(schema.sales.id, id)).all();
    expect(row?.monto).toBe(450_00n);
    expect(typeof row?.monto).toBe('bigint');
    expect(row?.categoria).toBe('Producto');
  });

  it('round-trips an Expense with nullable proveedor and recurrent link', () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE2';
    db.insert(schema.expenses)
      .values({
        id,
        fecha: '2026-04-23',
        concepto: 'Renta del local',
        categoria: 'Renta',
        monto: 1_200_000n,
        proveedor: null,
        gastoRecurrenteId: null,
        ...audit,
      })
      .run();
    const [row] = db.select().from(schema.expenses).all();
    expect(row?.monto).toBe(1_200_000n);
    expect(row?.proveedor).toBeNull();
  });

  it('round-trips a Product with umbral_stock_bajo default', () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE3';
    db.insert(schema.products)
      .values({
        id,
        nombre: 'Harina 1kg',
        sku: 'HAR-001',
        categoria: 'Materia Prima',
        costoUnitCentavos: 3500n,
        unidad: 'kg',
        umbralStockBajo: 5,
        ...audit,
      })
      .run();
    const [row] = db.select().from(schema.products).all();
    expect(row?.costoUnitCentavos).toBe(3500n);
    expect(row?.umbralStockBajo).toBe(5);
  });

  it('round-trips an InventoryMovement entrada', () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE4';
    db.insert(schema.inventoryMovements)
      .values({
        id,
        productoId: '01HZ8XQN9GZJXV8AKQ5X0C7TE3',
        fecha: '2026-04-23',
        tipo: 'entrada',
        cantidad: 10,
        costoUnitCentavos: 3500n,
        motivo: 'Compra a proveedor',
        nota: null,
        ...audit,
      })
      .run();
    const [row] = db.select().from(schema.inventoryMovements).all();
    expect(row?.tipo).toBe('entrada');
    expect(row?.cantidad).toBe(10);
  });

  it('round-trips an Employee', () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE5';
    db.insert(schema.employees)
      .values({
        id,
        nombre: 'María Pérez',
        puesto: 'Cajera',
        salarioCentavos: 3_500_000n,
        periodo: 'quincenal',
        ...audit,
      })
      .run();
    const [row] = db.select().from(schema.employees).all();
    expect(row?.salarioCentavos).toBe(3_500_000n);
    expect(row?.periodo).toBe('quincenal');
  });

  it('round-trips a Client', () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE6';
    db.insert(schema.clients)
      .values({
        id,
        nombre: 'Laura Hernández',
        telefono: '3312345678',
        email: null,
        nota: null,
        ...audit,
      })
      .run();
    const [row] = db.select().from(schema.clients).all();
    expect(row?.nombre).toBe('Laura Hernández');
  });

  it('round-trips a ClientPayment', () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE7';
    db.insert(schema.clientPayments)
      .values({
        id,
        ventaId: '01HZ8XQN9GZJXV8AKQ5X0C7TE1',
        fecha: '2026-04-23',
        montoCentavos: 50_000n,
        metodo: 'Transferencia',
        nota: null,
        ...audit,
      })
      .run();
    const [row] = db.select().from(schema.clientPayments).all();
    expect(row?.montoCentavos).toBe(50_000n);
    expect(row?.metodo).toBe('Transferencia');
  });

  it('round-trips a DayClose preserving signed bigint diferencia', () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE8';
    db.insert(schema.dayCloses)
      .values({
        id,
        fecha: '2026-04-23',
        efectivoEsperadoCentavos: 250_000n,
        efectivoContadoCentavos: 248_000n,
        diferenciaCentavos: -2000n,
        explicacion: 'Cambio para cliente',
        cerradoPor: 'Operativo',
        ...audit,
      })
      .run();
    const [row] = db.select().from(schema.dayCloses).all();
    expect(row?.diferenciaCentavos).toBe(-2000n);
  });

  it('round-trips a RecurringExpense with boolean activo', () => {
    const id = '01HZ8XQN9GZJXV8AKQ5X0C7TE9';
    db.insert(schema.recurringExpenses)
      .values({
        id,
        concepto: 'Renta',
        categoria: 'Renta',
        montoCentavos: 1_200_000n,
        proveedor: null,
        frecuencia: 'mensual',
        diaDelMes: 1,
        diaDeLaSemana: null,
        proximoDisparo: '2026-05-01',
        activo: true,
        ...audit,
      })
      .run();
    const [row] = db.select().from(schema.recurringExpenses).all();
    expect(row?.activo).toBe(true);
    expect(typeof row?.activo).toBe('boolean');
    expect(row?.diaDelMes).toBe(1);
  });
});
