import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';
import {
  classifyMovementOrigin,
  computeUsage,
  PORTAL_DEVICE_ID,
  type UsageRecord,
} from '@xangarro/domain/usage';

import { createDb, type Db } from '../src/client';
import { usageCounts } from '../src/queries/metering';
import { integrationSuite } from './support/db';

/**
 * `xangarro.usage_counts()` (0010) — the single SQL definition of usage — is
 * held equal to its TypeScript twin, `computeUsage`, over rows that sit on
 * every OQ-5 edge: the CDMX month boundary, each movement origin (portal
 * rows included), a
 * soft-deleted sale, a product deleted mid-month. Seeded as the owner, read
 * as `xangarro_metering`, the role the nightly recompute uses.
 */
const { url, describe } = integrationSuite();
const BIZ = `01HZ8XQN9GZJXV8AKQ5X0C${Date.now().toString(36).slice(-4).toUpperCase()}`;
const OTHER = `${BIZ.slice(0, -1)}Z`;

function roleUrl(appUrl: string, role: string): string {
  const u = new URL(appUrl);
  u.username = role;
  u.password = role;
  return u.toString();
}

const SALES = [
  { at: '2026-09-01T05:59:00.000Z', deleted: null }, // 23:59 on 31 Aug in CDMX
  { at: '2026-09-01T06:00:00.000Z', deleted: null }, // 00:00 on 1 Sep in CDMX
  { at: '2026-09-10T12:00:00.000Z', deleted: '2026-09-11T12:00:00.000Z' },
];
const EXPENSES = ['2026-08-20T12:00:00.000Z', '2026-09-02T12:00:00.000Z'];
const MOVES = [
  { motivo: 'Venta', nota: null },
  { motivo: 'Conversión', nota: null },
  { motivo: 'Devolución de cliente', nota: 'Cancelación de venta: V-1' },
  { motivo: 'Devolución de cliente', nota: null },
  { motivo: 'Merma', nota: null },
  // Written in the portal: counted as `portal` whatever the motivo (C-12).
  { motivo: 'Ajuste de inventario', nota: null, device: PORTAL_DEVICE_ID },
  { motivo: 'Venta', nota: null, device: PORTAL_DEVICE_ID },
].map((m) => ({ device: 'dev', ...m, at: '2026-09-05T12:00:00.000Z' }));
const PRODUCTS = [
  { at: '2026-07-01T12:00:00.000Z', deleted: null },
  { at: '2026-07-01T12:00:00.000Z', deleted: '2026-08-15T12:00:00.000Z' },
  { at: '2026-09-03T12:00:00.000Z', deleted: null },
];

async function seed(owner: postgres.Sql): Promise<void> {
  const audit = (id: string, at: string, deleted: string | null) => ({
    id,
    business_id: BIZ,
    device_id: 'dev',
    created_at: at,
    updated_at: at,
    deleted_at: deleted,
  });
  await owner`INSERT INTO businesses ${owner({ ...audit(BIZ, SALES[0]!.at, null), nombre: 'Uso', regimen_fiscal: 'RESICO', isr_tasa: 125 })}`;
  for (const [i, s] of SALES.entries()) {
    await owner`INSERT INTO sales ${owner({ ...audit(`${BIZ}-s${i}`, s.at, s.deleted), fecha: s.at.slice(0, 10), concepto: 'x', categoria: 'Producto', monto_centavos: 100, metodo: 'Efectivo', estado_pago: 'pagado', producto_id: 'p' })}`;
  }
  for (const [i, at] of EXPENSES.entries()) {
    await owner`INSERT INTO expenses ${owner({ ...audit(`${BIZ}-e${i}`, at, null), fecha: at.slice(0, 10), concepto: 'x', categoria: 'Otro', monto_centavos: 100 })}`;
  }
  for (const [i, m] of MOVES.entries()) {
    await owner`INSERT INTO inventory_movements ${owner({ ...audit(`${BIZ}-m${i}`, m.at, null), device_id: m.device, producto_id: 'p', fecha: m.at.slice(0, 10), tipo: 'entrada', cantidad: 1, costo_unit_centavos: 1, motivo: m.motivo, nota: m.nota })}`;
  }
  for (const [i, p] of PRODUCTS.entries()) {
    await owner`INSERT INTO products ${owner({ ...audit(`${BIZ}-p${i}`, p.at, p.deleted), nombre: 'x', categoria: 'Otro', costo_unit_centavos: 1, unidad: 'pza', precio_venta_centavos: 1 })}`;
  }
}

function domainRecords(): UsageRecord[] {
  return [
    ...SALES.map((s) => ({ kind: 'ventaLinea' as const, at: s.at, ticketId: null })),
    ...EXPENSES.map((at) => ({ kind: 'gasto' as const, at })),
    ...MOVES.map((m) => ({
      kind: 'movimientoInventario' as const,
      at: m.at,
      origen: classifyMovementOrigin({ motivo: m.motivo, nota: m.nota, deviceId: m.device }),
    })),
    ...PRODUCTS.map((p) => ({ kind: 'producto' as const, deletedAt: p.deleted })),
  ];
}

describe('xangarro.usage_counts(): the one SQL count, equal to computeUsage', () => {
  let owner: postgres.Sql;
  let metering: Db;

  beforeAll(async () => {
    owner = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => {} });
    metering = createDb(roleUrl(url as string, 'xangarro_metering'));
    await seed(owner);
  });

  afterAll(async () => {
    await metering?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('counts each month as the domain does, zeros included', async () => {
    const rows = await usageCounts(metering, [BIZ, OTHER], '2026-07', '2026-09');
    const mine = rows.filter((r) => r.businessId === BIZ);
    assert.deepEqual(
      mine.map((r) => r.period),
      ['2026-07', '2026-08', '2026-09'],
    );
    for (const r of mine) {
      const expected = computeUsage(domainRecords(), r.period);
      assert.equal(r.transactions, expected.transactions, `transactions ${r.period}`);
    }
    // Open month: active now, as the domain counts a catalog snapshot.
    assert.equal(mine[2]!.activeProducts, computeUsage(domainRecords(), '2026-09').activeProducts);
    // Closed months: active at month end — the deleted one counts in July only.
    assert.deepEqual([mine[0]!.activeProducts, mine[1]!.activeProducts], [2, 1]);
    assert.ok(rows.filter((r) => r.businessId === OTHER).every((r) => r.transactions === 0));
  });

  it('with no ids, counts every live business', async () => {
    const rows = await usageCounts(metering, null, '2026-09', '2026-09');
    assert.equal(rows.find((r) => r.businessId === BIZ)?.transactions, 7);
  });

  it('refuses more than 24 months and a reversed range by returning nothing', async () => {
    assert.deepEqual(await usageCounts(metering, [BIZ], '2024-01', '2026-01'), []);
    assert.deepEqual(await usageCounts(metering, [BIZ], '2026-09', '2026-08'), []);
  });

  it('lets the metering role count, not read what was sold', async () => {
    await assert.rejects(
      metering.$client`SELECT monto_centavos FROM sales LIMIT 1`,
      /permission denied/,
    );
    await assert.rejects(metering.$client`DELETE FROM usage_counters`, /permission denied/);
  });
});
