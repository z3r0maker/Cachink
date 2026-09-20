/**
 * The register's data runtime (ADR-071 §4, O-06): one Web Worker owning the
 * SQLite-WASM database, persisted to OPFS, running the same migrations,
 * repositories, use cases and SyncEngine as the phone — one data layer, never
 * two. The main thread talks to it through the typed client in `client.ts`.
 */

import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from '@xangarro/data';
import { runMigrations } from '@xangarro/data';
import { ApiClient, SyncEngine, type SyncRunResult } from '@xangarro/sync';

import { POR_METODO } from './router';
import { opfsRead, opfsWrite } from './opfs';
import { registrarTicket } from './tickets';
import type { WorkerRequest, WorkerResponse } from './protocol';

export type { BootInfo, OperadorPara, SesionAbierta } from './protocol';

/** The WASM binary ships as a static asset the Worker fetches by URL. */
const WASM_URL = '/sql-wasm.wasm';

type Db = ReturnType<typeof drizzle>;

interface Runtime {
  readonly sql: SqlJsDatabase;
  readonly db: Db;
  readonly engine: SyncEngine;
}

let runtime: Runtime | null = null;
let deviceToken: string | null = null;

async function openRuntime(): Promise<Runtime> {
  const SQL = await initSqlJs({ locateFile: () => WASM_URL });
  const persisted = await opfsRead();
  const sql = persisted ? new SQL.Database(persisted) : new SQL.Database();
  const db = drizzle(sql, { schema }) as Db;
  if (persisted === null) {
    // sql.js is a single connection: its BEGIN/COMMIT is visible across runs.
    await runMigrations(db as never, { skipTransactions: true });
  }
  const engine = new SyncEngine({
    db: db as never,
    client: new ApiClient({ baseUrl: '' }),
    getToken: async () => deviceToken,
  });
  return { sql, db, engine };
}

async function boot(): Promise<{ fresh: boolean }> {
  if (runtime === null) {
    const hadDb = (await opfsRead()) !== null;
    runtime = await openRuntime();
    return { fresh: !hadDb };
  }
  return { fresh: false };
}

async function persist(): Promise<void> {
  if (runtime !== null) await opfsWrite(runtime.sql.export());
}

/** Record a sale (O-06); every access-shaped op persists afterwards. */
async function registrar(
  input: Parameters<typeof registrarTicket>[1],
  ctx: Parameters<typeof registrarTicket>[2],
): Promise<{ folio: number }> {
  if (runtime === null) throw new Error('runtime not booted');
  return runAccess((rt) => registrarTicket(rt.db, input, ctx));
}

async function sync(token: string | null): Promise<SyncRunResult> {
  if (runtime === null) throw new Error('runtime not booted');
  deviceToken = token;
  try {
    return await runtime.engine.syncNow();
  } finally {
    await persist();
  }
}

/** The queue's counters, as Registros por enviar and the header pill show them. */
async function counts(): Promise<{ pending: number; rejected: number; retrying: number }> {
  if (runtime === null) throw new Error('runtime not booted');
  return runtime.engine.counts();
}

self.onmessage = async (event: MessageEvent<WorkerRequest>): Promise<void> => {
  const { id } = event.data;
  try {
    const data = await handle(event.data);
    const response: WorkerResponse = { id, ok: true, data };
    self.postMessage(response);
  } catch (e) {
    const response: WorkerResponse = { id, ok: false, error: String(e) };
    self.postMessage(response);
  }
};

async function handle(request: WorkerRequest): Promise<unknown> {
  switch (request.method) {
    case 'boot':
      return boot();
    case 'registrar':
      return registrar(request.input, request.ctx);
    case 'sync':
      return sync(request.token);
    case 'counts':
      return counts();
    default: {
      const fn = POR_METODO[request.method];
      if (fn === undefined) throw new Error('unknown method');
      return runAccess((rt) => fn(request, rt));
    }
  }
}

async function runAccess<T>(fn: (rt: Runtime) => Promise<T>): Promise<T> {
  if (runtime === null) throw new Error('runtime not booted');
  try {
    return await fn(runtime);
  } finally {
    await persist();
  }
}
