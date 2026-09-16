/**
 * Retention purge (A-11) against real SQLite with foreign keys ON.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import {
  DrizzleAppConfigRepository,
  DrizzleClientPaymentsRepository,
  DrizzleInventoryMovementsRepository,
  DrizzleProductsRepository,
  DrizzleSalesRepository,
  type CachinkDatabase,
} from '@xangarro/data';
import type { BusinessId, DeviceId, ProductId } from '@xangarro/domain';
import {
  makeNewClientPayment,
  makeNewInventoryMovement,
  makeNewProduct,
  makeNewSale,
} from '../../testing/src/index.js';
import { makeFreshDb } from '../../data/tests/helpers/fresh-db.js';
import { purgeAcknowledged } from '../src/retention.js';
import { SYNC_CONFIG_KEYS } from '../src/sync-keys.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const SERVER_NOW = '2026-09-16T12:00:00.000Z';
const OLD = '2026-06-01T12:00:00.000Z'; // 107 days before SERVER_NOW
const RECENT = '2026-09-01T12:00:00.000Z';

let db: CachinkDatabase;
let appConfig: DrizzleAppConfigRepository;
let seq = 0;

async function synced(opts: { pullAt?: boolean; ack?: number; hwm?: number } = {}) {
  if (opts.pullAt !== false) await appConfig.set(SYNC_CONFIG_KEYS.lastPullAt, SERVER_NOW);
  await appConfig.set(SYNC_CONFIG_KEYS.lastServerTime, SERVER_NOW);
  await appConfig.set(SYNC_CONFIG_KEYS.acknowledgedThrough, String(opts.ack ?? 1000));
  await appConfig.set(SYNC_CONFIG_KEYS.pushHwm, String(opts.hwm ?? 1_000_000));
}

/** Backdate a row and mark it accepted by the server. */
async function aged(table: string, id: string, createdAt: string, accepted = true) {
  await db.run(sql`UPDATE ${sql.raw(table)} SET created_at = ${createdAt} WHERE id = ${id}`);
  if (!accepted) return;
  seq += 1;
  await db.run(sql`INSERT INTO __sync_row_status (table_name, row_id, status, server_seq)
    VALUES (${table}, ${id}, 'accepted', ${seq})`);
}

async function exists(table: string, id: string): Promise<boolean> {
  const r = await db.get<{ n: number }>(
    sql`SELECT COUNT(*) AS n FROM ${sql.raw(table)} WHERE id = ${id}`,
  );
  return (r?.n ?? 0) > 0;
}

async function product(): Promise<ProductId> {
  const p = await new DrizzleProductsRepository(db, DEV).create(
    makeNewProduct({ businessId: BIZ }),
  );
  return p.id;
}

async function sale(productoId: ProductId, over: Record<string, unknown> = {}) {
  return new DrizzleSalesRepository(db, DEV).create(
    makeNewSale({ businessId: BIZ, productoId, ...over } as never),
  );
}

const purge = () => purgeAcknowledged({ db, appConfig });

beforeEach(async () => {
  db = makeFreshDb();
  await db.run(sql`PRAGMA foreign_keys = ON`);
  appConfig = new DrizzleAppConfigRepository(db);
  seq = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('purgeAcknowledged', () => {
  it('does nothing before the first successful pull', async () => {
    const s = await sale(await product());
    await aged('sales', s.id, OLD);
    await synced({ pullAt: false });
    expect((await purge()).skipped).toBe('never-pulled');
    expect(await exists('sales', s.id)).toBe(true);
  });

  it('deletes acknowledged old rows and keeps unsynced, unacknowledged and recent ones', async () => {
    const pid = await product();
    const gone = await sale(pid);
    const unsynced = await sale(pid, { fecha: '2026-01-02' });
    const beyondAck = await sale(pid, { fecha: '2026-01-03' });
    const recent = await sale(pid, { fecha: '2026-01-04' });
    await aged('sales', gone.id, OLD);
    await aged('sales', unsynced.id, '2026-02-01T00:00:00.000Z', false);
    await aged('sales', beyondAck.id, OLD);
    await aged('sales', recent.id, RECENT);
    // The server has acknowledged through seq 3; beyondAck's seq is past that.
    await db.run(
      sql`UPDATE __sync_row_status SET server_seq = 5000 WHERE row_id = ${beyondAck.id}`,
    );
    await synced({ ack: 3 });
    const out = await purge();
    expect(out.deleted).toEqual({ sales: 1 });
    expect(await exists('sales', gone.id)).toBe(false);
    for (const kept of [unsynced, beyondAck, recent])
      expect(await exists('sales', kept.id)).toBe(true);
    const status = await db.get<{ n: number }>(
      sql`SELECT COUNT(*) AS n FROM __sync_row_status WHERE row_id = ${gone.id}`,
    );
    expect(status?.n).toBe(0);
  });

  it('never trusts the device clock: +2 years with no server contact deletes nothing', async () => {
    const s = await sale(await product());
    await aged('sales', s.id, RECENT);
    await synced();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2028-09-16T12:00:00.000Z'));
    expect((await purge()).deleted).toEqual({});
    expect(await exists('sales', s.id)).toBe(true);
  });

  it('keeps stock identical by folding purged movements into the baseline', async () => {
    const pid = await product();
    const movs = new DrizzleInventoryMovementsRepository(db, DEV);
    const entrada = await movs.create(
      makeNewInventoryMovement({ businessId: BIZ, productoId: pid }),
    );
    const salida = await movs.create(
      makeNewInventoryMovement({ businessId: BIZ, productoId: pid, tipo: 'salida', cantidad: 3 }),
    );
    const reciente = await movs.create(
      makeNewInventoryMovement({ businessId: BIZ, productoId: pid, tipo: 'salida', cantidad: 2 }),
    );
    await aged('inventory_movements', entrada.id, OLD);
    await aged('inventory_movements', salida.id, OLD);
    await aged('inventory_movements', reciente.id, RECENT);
    await synced();
    expect(await movs.sumStock(pid)).toBe(5);
    expect((await purge()).deleted).toEqual({ inventory_movements: 2 });
    expect(await movs.sumStock(pid)).toBe(5);
    await purge();
    expect(await movs.sumStock(pid)).toBe(5);
  });

  it('keeps unpaid credit sales with their payments, and rows with unpushed edits', async () => {
    const pid = await product();
    const credito = await sale(pid, { metodo: 'Crédito', estadoPago: 'parcial' });
    const pago = await new DrizzleClientPaymentsRepository(db, DEV).create(
      makeNewClientPayment({ businessId: BIZ, ventaId: credito.id }),
    );
    const edited = await sale(pid, { fecha: '2026-01-05' });
    await aged('sales', credito.id, OLD);
    await aged('client_payments', pago.id, OLD);
    await aged('sales', edited.id, OLD);
    const log = await db.get<{ id: number }>(
      sql`SELECT MAX(id) AS id FROM __cachink_change_log WHERE row_id = ${edited.id}`,
    );
    await synced({ hwm: (log?.id ?? 1) - 1 });
    expect((await purge()).deleted).toEqual({});
    for (const [t, id] of [
      ['sales', credito.id],
      ['client_payments', pago.id],
      ['sales', edited.id],
    ] as const)
      expect(await exists(t, id)).toBe(true);
  });

  it('keeps an open caja turno and a closed one still referenced by a kept sale', async () => {
    const pid = await product();
    await db.run(sql`INSERT INTO users (id, nombre, pin_hash, business_id, device_id, created_at, updated_at)
      VALUES ('U1', 'Toni', 'h', ${BIZ}, ${DEV}, ${OLD}, ${OLD})`);
    const turno = (id: string, cierre: string | null) =>
      db.run(sql`INSERT INTO caja_turnos (id, user_id, fecha, apertura_at, cierre_at, monto_apertura_centavos,
        efectivo_adicional_centavos, business_id, device_id, created_at, updated_at)
        VALUES (${id}, 'U1', '2026-06-01', ${OLD}, ${cierre}, 50000, 0, ${BIZ}, ${DEV}, ${OLD}, ${OLD})`);
    await turno('T-OPEN', null);
    await turno('T-USED', OLD);
    await turno('T-DONE', OLD);
    const credito = await sale(pid, {
      metodo: 'Crédito',
      estadoPago: 'pendiente',
      cajaTurnoId: 'T-USED',
    });
    for (const id of ['T-OPEN', 'T-USED', 'T-DONE']) await aged('caja_turnos', id, OLD);
    await aged('sales', credito.id, OLD);
    await synced();
    expect((await purge()).deleted).toEqual({ caja_turnos: 1 });
    expect(await exists('caja_turnos', 'T-DONE')).toBe(false);
    expect(await exists('caja_turnos', 'T-OPEN')).toBe(true);
    expect(await exists('caja_turnos', 'T-USED')).toBe(true);
    expect(await db.all(sql`PRAGMA foreign_key_check`)).toEqual([]);
  });
});
