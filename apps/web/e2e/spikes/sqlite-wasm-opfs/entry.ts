/**
 * O-02 spike entry — SQLite-WASM persisted in OPFS, driving the real
 * `@xangarro/data` migrations, repositories and change-log triggers.
 *
 * Bundled to an IIFE by the spec's setup (esbuild), served to the page,
 * run in Chromium and WebKit. This file exists only to prove ADR-071 §4;
 * it is not shipped code.
 */

import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import WASM_BINARY from 'sql.js/dist/sql-wasm-browser.wasm?binary';
import { drizzle } from 'drizzle-orm/sql-js';
import {
  migrationSqlByTag,
  DrizzleTicketsRepository,
  DrizzleSalesRepository,
} from '@xangarro/data';
import type { BusinessId, DeviceId } from '@xangarro/domain';
import * as schema from '@xangarro/data';

const OPFS_NAME = 'xangarro-spike.sqlite3';

interface SpikeResult {
  readonly ok: boolean;
  readonly detail?: string;
}

function statements(sqlText: string): readonly string[] {
  return sqlText
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function opfsRead(): Promise<Uint8Array | null> {
  const root = await navigator.storage.getDirectory();
  const handle = await root.getFileHandle(OPFS_NAME, { create: true });
  const file = await handle.getFile();
  if (file.size === 0) return null;
  return new Uint8Array(await file.arrayBuffer());
}

async function opfsWrite(bytes: Uint8Array): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const handle = await root.getFileHandle(OPFS_NAME, { create: true });
  const writable = await handle.createWritable();
  await writable.write(bytes);
  await writable.close();
}

/** `?fresh=1` deletes the OPFS file first, so the spec controls the seed state. */
async function opfsReset(): Promise<void> {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry(OPFS_NAME).catch(() => undefined);
}

const JOURNAL = [
  '0000_initial',
  '0001_add_business_fiscal',
  '0002_add_business_regimen_sat',
  '0003_mensajes_respuestas_operador',
  '0004_c18_receivables_expected_cash',
  '0005_c17_tickets_sales_lines',
  '0006_capture_client',
  '0007_operator_only',
  '0008_stock_baseline',
  '0009_xangarro_sync_tables',
] as const;

/** The whole merged journal applies on WASM (skipped when OPFS already holds it). */
function applyMigrations(db: SqlJsDatabase, persisted: boolean): SpikeResult {
  try {
    if (!persisted) {
      for (const tag of JOURNAL) {
        for (const stmt of statements(migrationSqlByTag[tag] ?? '')) db.exec(stmt);
      }
    }
    const applied = db.exec(
      "SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name IN ('tickets', 'sales', '__xangarro_change_log', '__sync_row_status')",
    );
    const n = Number(applied[0]?.values[0]?.[0] ?? 0);
    return { ok: n === 4, detail: `${n}/4 tables present` };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}

/** The business + product the repository writes reference (idempotent across reloads). */
function seedReferences(db: SqlJsDatabase): void {
  db.exec(
    `INSERT OR IGNORE INTO businesses (id, nombre, regimen_fiscal, isr_tasa, logo_url, business_id, device_id, created_at, updated_at)
     VALUES ('B1', 'Spike', 'RESICO', 125, NULL, 'B1', 'D1', '2026-09-19T00:00:00.000Z', '2026-09-19T00:00:00.000Z')`,
  );
  db.exec(
    `INSERT OR IGNORE INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad, umbral_stock_bajo, tipo, seguir_stock, precio_venta_centavos, estado_revision, business_id, device_id, created_at, updated_at)
     VALUES ('P1', 'Taco', NULL, 'Producto Terminado', 500, 'pza', 3, 'producto', 0, 2500, 'aprobado', 'B1', 'D1', '2026-09-19T00:00:00.000Z', '2026-09-19T00:00:00.000Z')`,
  );
}

/** A repository round-trip through the same Drizzle repositories the phone runs. */
async function roundTrip(
  db: SqlJsDatabase,
  drizzleDb: ReturnType<typeof drizzle>,
  persisted: boolean,
): Promise<SpikeResult> {
  const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
  const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
  const EXPECTED_SALES = 1; // written on the first boot, re-read after the reload
  try {
    seedReferences(db);
    if (!persisted) {
      const ticket = await new DrizzleTicketsRepository(drizzleDb, DEV).create({
        folio: 1,
        fecha: '2026-09-19',
        concepto: 'Spike',
        metodo: 'Efectivo',
        estadoPago: 'pagado',
        businessId: BIZ,
      });
      await new DrizzleSalesRepository(drizzleDb, DEV).create({
        ticketId: ticket.id,
        fecha: '2026-09-19',
        concepto: 'Spike line',
        categoria: 'Producto',
        monto: 2_500n,
        productoId: 'P1' as never,
        cantidad: 1,
        businessId: BIZ,
      });
    }
    const rows = db.exec('SELECT count(*) FROM sales');
    const n = Number(rows[0]?.values[0]?.[0] ?? 0);
    return { ok: n === EXPECTED_SALES, detail: `${n} sales rows (expected ${EXPECTED_SALES})` };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}

/** The change-log triggers fired on the WASM inserts. */
function changeLogCount(db: SqlJsDatabase, persisted: boolean): SpikeResult {
  try {
    const rows = db.exec('SELECT count(*) FROM __xangarro_change_log');
    const n = Number(rows[0]?.values[0]?.[0] ?? 0);
    void persisted;
    return { ok: n >= 2, detail: `${n} log rows` };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}

async function main(): Promise<void> {
  document.title = 'boot';
  const fresh = new URLSearchParams(location.search).get('fresh') === '1';
  if (fresh) await opfsReset();

  const SQL = await initSqlJs({ wasmBinary: WASM_BINARY });

  const persisted = await opfsRead();
  const db: SqlJsDatabase = persisted ? new SQL.Database(persisted) : new SQL.Database();
  const drizzleDb = drizzle(db, { schema });

  const results: Record<string, SpikeResult> = {};
  results.migrations = applyMigrations(db, persisted !== null);

  results.roundtrip = await roundTrip(db, drizzleDb, persisted !== null);
  results.changeLog = changeLogCount(db, persisted !== null);

  // 4. Persist to OPFS; a reload re-reads it (the spec reloads the page).
  try {
    await opfsWrite(db.export());
    results.opfs = { ok: true, detail: `${db.export().byteLength} bytes persisted` };
  } catch (e) {
    results.opfs = { ok: false, detail: String(e) };
  }

  window.__spike = { results, persistedFromOpfs: persisted !== null };
  document.title = 'done';
  const log = document.getElementById('log');
  if (log) log.textContent = JSON.stringify(results, null, 2);
}

void main().catch((e) => {
  document.title = 'fail';
  const log = document.getElementById('log');
  if (log) log.textContent += `FAILED: ${String(e)}`;
});
declare global {
  interface Window {
    __spike?: { results: Record<string, SpikeResult>; persistedFromOpfs: boolean };
  }
}
