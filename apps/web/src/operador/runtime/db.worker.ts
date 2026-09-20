/**
 * The register's data runtime (ADR-071 §4, O-06): one Web Worker owning the
 * SQLite-WASM database, persisted to OPFS, running the same migrations,
 * repositories, use cases and SyncEngine as the phone — one data layer, never
 * two. The main thread talks to it through the typed client in `client.ts`.
 */

import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from '@xangarro/data';
import {
  runMigrations,
  DrizzleTicketsRepository,
  DrizzleSalesRepository,
  DrizzleClientsRepository,
  DrizzleProductsRepository,
  DrizzleInventoryMovementsRepository,
  DrizzleCajaTurnosRepository,
} from '@xangarro/data';
import { RegistrarTicketUseCase, type RegistrarTicketInput } from '@xangarro/application';
import { ApiClient, SyncEngine, type SyncRunResult } from '@xangarro/sync';

import { opfsRead, opfsWrite } from './opfs';

/** The WASM binary ships as a static asset the Worker fetches by URL. */
const WASM_URL = '/sql-wasm.wasm';

export interface BootInfo {
  /** True when no OPFS database existed and the journal just applied. */
  readonly fresh: boolean;
}

export interface RegistrarContext {
  readonly deviceId: string;
  readonly userId: string | null;
  readonly stockEnabled: boolean;
}

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

async function boot(): Promise<BootInfo> {
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

/** Record a sale exactly as the phone does — the atomic use case (ADR-073). */
async function registrar(
  input: RegistrarTicketInput,
  ctx: RegistrarContext,
): Promise<{ folio: number }> {
  if (runtime === null) throw new Error('runtime not booted');
  const { db } = runtime;
  const useCase = new RegistrarTicketUseCase(
    new DrizzleTicketsRepository(db as never, ctx.deviceId as never),
    new DrizzleSalesRepository(db as never, ctx.deviceId as never),
    new DrizzleClientsRepository(db as never, ctx.deviceId as never),
    new DrizzleProductsRepository(db as never, ctx.deviceId as never),
    new DrizzleInventoryMovementsRepository(db as never, ctx.deviceId as never),
    new DrizzleCajaTurnosRepository(db as never, ctx.deviceId as never),
    { stockEnabled: ctx.stockEnabled, userId: (ctx.userId as never) ?? null },
  );
  try {
    const result = await useCase.execute(input);
    return { folio: result.ticket.folio };
  } finally {
    await persist();
  }
}

export type WorkerRequest =
  | { readonly id: number; readonly method: 'boot' }
  | {
      readonly id: number;
      readonly method: 'registrar';
      readonly input: RegistrarTicketInput;
      readonly ctx: RegistrarContext;
    }
  | { readonly id: number; readonly method: 'sync'; readonly token: string | null }
  | { readonly id: number; readonly method: 'counts' };

export type WorkerResponse =
  | { readonly id: number; readonly ok: true; readonly data: unknown }
  | { readonly id: number; readonly ok: false; readonly error: string };

self.onmessage = async (event: MessageEvent<WorkerRequest>): Promise<void> => {
  const { id, method } = event.data;
  try {
    const data =
      method === 'boot'
        ? await boot()
        : method === 'registrar'
          ? await registrar(event.data.input, event.data.ctx)
          : method === 'sync'
            ? await sync(event.data.token)
            : await counts();
    const response: WorkerResponse = { id, ok: true, data };
    self.postMessage(response);
  } catch (e) {
    const response: WorkerResponse = { id, ok: false, error: String(e) };
    self.postMessage(response);
  }
};

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
