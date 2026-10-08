/**
 * The register's data runtime (ADR-071 §4, O-06): one Web Worker owning the
 * SQLite-WASM database, persisted to OPFS, running the same migrations,
 * repositories, use cases and SyncEngine as the phone — one data layer, never
 * two. The main thread talks to it through the typed client in `client.ts`.
 */

import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from '@xangarro/data';
import { DrizzleAppConfigRepository, runMigrations } from '@xangarro/data';
import { ApiClient, snapshotProgress, SyncEngine, type SyncRunResult } from '@xangarro/sync';

import { POR_METODO } from './router';
import { opfsRead, opfsWrite } from './opfs';
import { EN_OTRA_PESTANA, reclamador, type Candados } from './pestana';
import { registrarTicket } from './tickets';
import type { WorkerRequest, WorkerResponse } from './protocol';

type SyncRequest = Extract<WorkerRequest, { method: 'sync' }>;

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
const NO_ARRANCADO = 'runtime not booted';
let deviceToken: string | null = null;
/** Opening, once: a second `boot` while the first reads OPFS joins it (never two copies). */
let arranque: Promise<boolean> | null = null;
/** The tail of the OPFS writes: each waits for the one before (DB3-CAJA-04, partial). */
let escritura: Promise<void> = Promise.resolve();

/** One tab owns the register (DB3-CAJA-01): the lock is this Worker's, for its lifetime. */
const candado = reclamador((navigator as { locks?: Candados }).locks);

type SqlJs = Awaited<ReturnType<typeof initSqlJs>>;
let motor: Promise<SqlJs> | null = null;

/**
 * The SQLite engine, loaded once. A tab waiting for the register loads it
 * while it waits (no database is opened), so it can take over even if the
 * connection drops before the other tab closes.
 */
function cargarMotor(): Promise<SqlJs> {
  motor ??= initSqlJs({ locateFile: () => WASM_URL });
  motor.catch(() => {
    motor = null;
  });
  return motor;
}

async function openRuntime(): Promise<Runtime> {
  const SQL = await cargarMotor();
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

/** True when the database was created now (a first boot). */
async function abrir(): Promise<boolean> {
  const hadDb = (await opfsRead()) !== null;
  runtime = await openRuntime();
  return !hadDb;
}

/** Open the register — only in the tab that owns it; another tab's copy would erase this one's sales. */
async function boot(): Promise<{ fresh: boolean }> {
  if ((await candado.reclamar(false)) === 'ocupada') throw new Error(EN_OTRA_PESTANA);
  if (arranque !== null) {
    await arranque;
    return { fresh: false };
  }
  arranque = abrir();
  arranque.catch(() => {
    arranque = null;
  });
  return { fresh: await arranque };
}

/**
 * Write the database back to OPFS. The writes queue: each exports the bytes
 * when its turn comes, so two overlapping writes can never land out of order
 * and the file always ends at the latest state. Every caller still awaits its
 * own write (no debounce: durability is unchanged).
 */
function persist(): Promise<void> {
  const rt = runtime;
  if (rt === null) return Promise.resolve();
  const turno = escritura.then(() => opfsWrite(rt.sql.export()));
  escritura = turno.catch(() => undefined);
  return turno;
}

/** Record a sale (O-06); every access-shaped op persists afterwards. */
async function registrar(
  input: Parameters<typeof registrarTicket>[1],
  ctx: Parameters<typeof registrarTicket>[2],
): Promise<{ folio: number }> {
  if (runtime === null) throw new Error(NO_ARRANCADO);
  return runAccess((rt) => registrarTicket(rt.db, input, ctx));
}

/** A capture pushes (and pulls at most every 45 s); `completa` pushes and pulls. */
async function sync(request: SyncRequest): Promise<SyncRunResult> {
  if (runtime === null) throw new Error(NO_ARRANCADO);
  deviceToken = request.token;
  const opts = { manual: request.manual };
  let result: SyncRunResult | null = null;
  try {
    result =
      request.mode === 'captura'
        ? await runtime.engine.capture(opts)
        : await runtime.engine.syncNow(opts);
    return result;
  } finally {
    // A deferred run (backoff) touched nothing: skip the full-database write.
    if (result?.deferred !== true) await persist();
  }
}

/** The queue's counters, as Registros por enviar and the header pill show them. */
async function counts(): Promise<{
  pending: number;
  rejected: number;
  retrying: number;
  unsent: number;
}> {
  if (runtime === null) throw new Error(NO_ARRANCADO);
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
    case 'reclamar':
      void cargarMotor().catch(() => undefined);
      return candado.reclamar(request.esperar);
    case 'registrar':
      return registrar(request.input, request.ctx);
    case 'sync':
      return sync(request);
    case 'counts':
      return counts();
    case 'progresoSnapshot':
      // Read-only and polled while linking: no OPFS write, unlike `runAccess`.
      if (runtime === null) throw new Error(NO_ARRANCADO);
      return snapshotProgress(new DrizzleAppConfigRepository(runtime.db as never));
    default: {
      const fn = POR_METODO[request.method];
      if (fn === undefined) throw new Error('unknown method');
      return runAccess((rt) => fn(request, rt));
    }
  }
}

async function runAccess<T>(fn: (rt: Runtime) => Promise<T>): Promise<T> {
  if (runtime === null) throw new Error(NO_ARRANCADO);
  try {
    return await fn(runtime);
  } finally {
    await persist();
  }
}
