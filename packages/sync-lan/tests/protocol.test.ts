/**
 * Round-trip every wire-protocol shape and every encoded Delta across the
 * 10 synced tables (ADR-029). Rows here mirror the snake_case shape SQLite
 * returns, not the camelCase shape Drizzle's `$inferSelect` produces — the
 * codec runs before the row meets Drizzle on the receiver, so the wire
 * shape is the on-disk shape.
 */

import { describe, expect, it } from 'vitest';
import {
  PROTOCOL_HEADER,
  PROTOCOL_VERSION,
  SYNCED_TABLES,
  decodeDelta,
  deltaSchema,
  encodeDelta,
  isSyncedTable,
  pairRequestSchema,
  pairResponseSchema,
  pullResponseSchema,
  pushRequestSchema,
  pushResponseSchema,
  wireErrorSchema,
  wsEventSchema,
} from '../src/protocol/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV';
const TS = '2026-04-23T15:00:00.000Z';

/** Audit columns every synced row carries (snake_case, SQLite-shaped). */
const audit = {
  business_id: BIZ,
  device_id: DEV,
  created_at: TS,
  updated_at: TS,
  deleted_at: null,
};

/**
 * Minimal row fixtures, one per synced table. Every row carries the
 * required audit columns plus the minimum business-specific columns. Money
 * columns are bigint as they'd come out of Drizzle's `numeric({mode:'bigint'})`.
 */
const rowFixtures: Record<(typeof SYNCED_TABLES)[number], Record<string, unknown>> = {
  businesses: {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7B01',
    nombre: 'Tortillería',
    regimen_fiscal: 'RIF',
    isr_tasa: 0.3,
    logo_url: null,
    ...audit,
  },
  sales: {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7S01',
    fecha: '2026-04-23',
    concepto: 'Taco',
    categoria: 'Producto',
    monto_centavos: 45_000n,
    metodo: 'Efectivo',
    cliente_id: null,
    estado_pago: 'pagado',
    ...audit,
  },
  expenses: {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7G01',
    fecha: '2026-04-23',
    concepto: 'Renta',
    categoria: 'Renta',
    monto_centavos: 1_200_000n,
    proveedor: null,
    gasto_recurrente_id: null,
    ...audit,
  },
  products: {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7P01',
    nombre: 'Harina',
    sku: null,
    categoria: 'Materia Prima',
    costo_unit_centavos: 3500n,
    unidad: 'kg',
    umbral_stock_bajo: 5,
    ...audit,
  },
  inventory_movements: {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7M01',
    producto_id: '01HZ8XQN9GZJXV8AKQ5X0C7P01',
    fecha: '2026-04-23',
    tipo: 'entrada',
    cantidad: 10,
    costo_unit_centavos: 3500n,
    motivo: 'Compra a proveedor',
    nota: null,
    ...audit,
  },
  employees: {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7E01',
    nombre: 'Ana',
    puesto: 'Cajera',
    salario_centavos: 3_500_000n,
    periodo: 'quincenal',
    ...audit,
  },
  clients: {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7C01',
    nombre: 'Laura',
    telefono: '3312345678',
    email: null,
    nota: null,
    ...audit,
  },
  client_payments: {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7Y01',
    venta_id: '01HZ8XQN9GZJXV8AKQ5X0C7S01',
    fecha: '2026-04-23',
    monto_centavos: 20_000n,
    metodo: 'Transferencia',
    nota: null,
    ...audit,
  },
  day_closes: {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7D01',
    fecha: '2026-04-23',
    efectivo_esperado_centavos: 250_000n,
    efectivo_contado_centavos: 248_000n,
    diferencia_centavos: -2000n,
    explicacion: null,
    cerrado_por: 'Operativo',
    ...audit,
  },
  recurring_expenses: {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7R01',
    concepto: 'Renta',
    categoria: 'Renta',
    monto_centavos: 1_200_000n,
    proveedor: null,
    frecuencia: 'mensual',
    dia_del_mes: 1,
    dia_de_la_semana: null,
    proximo_disparo: '2026-05-01',
    activo: 1,
    ...audit,
  },
};

describe('protocol constants', () => {
  it('pins protocol version 1 and the canonical header name', () => {
    expect(PROTOCOL_VERSION).toBe(1);
    expect(PROTOCOL_HEADER).toBe('X-Cachink-Protocol');
  });

  it('lists exactly 10 synced tables (app_config excluded)', () => {
    expect(SYNCED_TABLES).toHaveLength(10);
    expect((SYNCED_TABLES as readonly string[]).includes('app_config')).toBe(false);
  });

  it('isSyncedTable narrows accepted strings', () => {
    expect(isSyncedTable('sales')).toBe(true);
    expect(isSyncedTable('app_config')).toBe(false);
    expect(isSyncedTable('')).toBe(false);
  });
});

describe('encodeDelta / decodeDelta — round-trips every synced table', () => {
  for (const table of SYNCED_TABLES) {
    it(`round-trips ${table}`, () => {
      const row = rowFixtures[table];
      const encoded = encodeDelta(table, row, 'insert');

      // Envelope fields are projected from the row.
      expect(encoded.table).toBe(table);
      expect(encoded.op).toBe('insert');
      expect(encoded.rowId).toBe(row['id']);
      expect(encoded.rowUpdatedAt).toBe(row['updated_at']);
      expect(encoded.rowDeviceId).toBe(row['device_id']);

      // Wire delta parses cleanly through Zod.
      const parsed = deltaSchema.parse(encoded);
      expect(parsed.table).toBe(table);

      // After decoding, every money column is bigint again.
      const { decodedRow } = decodeDelta(encoded);
      for (const [key, original] of Object.entries(row)) {
        if (typeof original === 'bigint') {
          expect(typeof decodedRow[key]).toBe('bigint');
          expect(decodedRow[key]).toBe(original);
        } else {
          expect(decodedRow[key]).toBe(original);
        }
      }
    });
  }

  it('serialises bigint money as a decimal string on the wire', () => {
    const delta = encodeDelta('sales', rowFixtures.sales, 'insert');
    expect(typeof delta.row['monto_centavos']).toBe('string');
    expect(delta.row['monto_centavos']).toBe('45000');
  });

  it('accepts negative money values (day_closes.diferencia_centavos)', () => {
    const delta = encodeDelta('day_closes', rowFixtures.day_closes, 'update');
    expect(delta.row['diferencia_centavos']).toBe('-2000');
    const { decodedRow } = decodeDelta(delta);
    expect(decodedRow['diferencia_centavos']).toBe(-2000n);
  });

  it('drops undefined values (JSON cannot carry them)', () => {
    const rowWithUndefined = { ...rowFixtures.clients, nota: undefined };
    const delta = encodeDelta('clients', rowWithUndefined, 'insert');
    expect('nota' in delta.row).toBe(false);
  });

  it('preserves null (null is a first-class JSON value)', () => {
    const delta = encodeDelta('clients', rowFixtures.clients, 'insert');
    expect(delta.row['telefono']).toBe('3312345678');
    expect(delta.row['email']).toBeNull();
  });

  it('rejects a money column containing a non-integer string', () => {
    const bad = { ...rowFixtures.sales, monto_centavos: '45.5' };
    expect(() => encodeDelta('sales', bad, 'insert')).toThrow(/money column/);
  });

  it('rejects a delta with a missing id (required envelope field)', () => {
    const bad = { ...rowFixtures.sales } as Record<string, unknown>;
    delete bad['id'];
    expect(() => encodeDelta('sales', bad, 'insert')).toThrow(/id/);
  });

  it('rejects a decode where the table is not one of the 10 synced tables', () => {
    const bad = {
      table: 'app_config',
      op: 'insert',
      rowId: '01HZ8XQN9GZJXV8AKQ5X0C7C01',
      row: { key: 'mode', value: '"local-standalone"' },
      rowUpdatedAt: TS,
      rowDeviceId: DEV,
    };
    expect(() => decodeDelta(bad)).toThrow();
  });

  it('rejects a decode where the op is not "insert" or "update"', () => {
    const encoded = encodeDelta('sales', rowFixtures.sales, 'insert');
    const tampered = { ...encoded, op: 'delete' as unknown };
    expect(() => decodeDelta(tampered)).toThrow();
  });

  it('encodes a soft-delete as op=update with deleted_at set', () => {
    const soft = { ...rowFixtures.sales, deleted_at: '2026-04-23T16:00:00.000Z' };
    const delta = encodeDelta('sales', soft, 'update');
    expect(delta.op).toBe('update');
    expect(delta.row['deleted_at']).toBe('2026-04-23T16:00:00.000Z');
  });
});

describe('pair / push / pull / WS event schemas', () => {
  it('validates a well-formed PairRequest + PairResponse', () => {
    expect(pairRequestSchema.parse({ pairingToken: 'abcdef12', deviceId: DEV })).toBeTruthy();
    expect(
      pairResponseSchema.parse({
        accessToken: 'abcdef12',
        businessId: BIZ,
        serverId: 'srv-abc',
      }),
    ).toBeTruthy();
  });

  it('rejects a PushRequest with more than 500 deltas', () => {
    const tiny = encodeDelta('sales', rowFixtures.sales, 'insert');
    const over = { deltas: Array.from({ length: 501 }, () => tiny) };
    expect(() => pushRequestSchema.parse(over)).toThrow();
  });

  it('validates a PushResponse with rejected stale rows', () => {
    expect(
      pushResponseSchema.parse({
        accepted: 3,
        rejected: [{ rowId: '01HZ8XQN9GZJXV8AKQ5X0C7S01', table: 'sales', reason: 'stale' }],
        lastServerSeq: 42,
      }),
    ).toBeTruthy();
  });

  it('validates a PullResponse', () => {
    expect(
      pullResponseSchema.parse({
        deltas: [encodeDelta('sales', rowFixtures.sales, 'insert')],
        nextSince: 10,
        hasMore: false,
      }),
    ).toBeTruthy();
  });

  it('validates a WsEvent change + ping', () => {
    expect(wsEventSchema.parse({ type: 'change', serverSeq: 1 })).toBeTruthy();
    expect(wsEventSchema.parse({ type: 'ping', ts: TS })).toBeTruthy();
  });

  it('rejects a WsEvent with an unknown type', () => {
    expect(() => wsEventSchema.parse({ type: 'wobble', ts: TS })).toThrow();
  });

  it('validates a WireError envelope', () => {
    expect(
      wireErrorSchema.parse({
        error: 'Protocol version mismatch',
        code: 'protocol_mismatch',
        protocolRequired: 1,
        protocolReceived: '7',
      }),
    ).toBeTruthy();
  });
});
