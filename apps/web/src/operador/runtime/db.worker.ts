/**
 * The register's data runtime (ADR-071 §4, O-06): one Web Worker owning the
 * SQLite-WASM database, persisted to OPFS, running the same migrations,
 * repositories, use cases and SyncEngine as the phone — one data layer, never
 * two. The main thread talks to it through the typed client in `client.ts`.
 */

import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from '@xangarro/data';
import { runMigrations, DrizzleTicketsRepository } from '@xangarro/data';
import {
  DrizzleSalesRepository,
  DrizzleClientsRepository,
  DrizzleProductsRepository,
  DrizzleInventoryMovementsRepository,
  DrizzleCajaTurnosRepository,
} from '@xangarro/data';
import { RegistrarTicketUseCase, type RegistrarTicketInput } from '@xangarro/application';
import { ApiClient, SyncEngine, type SyncRunResult } from '@xangarro/sync';

import * as access from './access';
import { catalogo } from './catalogo';
import { opfsRead, opfsWrite } from './opfs';
import type { RegistrarContext, WorkerRequest, WorkerResponse } from './protocol';

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

/** Record a sale exactly as the phone does — the atomic use case (ADR-073). */
async function registrar(
  input: RegistrarTicketInput,
  ctx: RegistrarContext,
): Promise<{ folio: number }> {
  if (runtime === null) throw new Error('runtime not booted');
  const { db } = runtime;
  const useCase = new RegistrarTicketUseCase(
    new DrizzleTicketsRepository(db as never, ctx.deviceId as never, (ctx.userId as never) ?? null),
    new DrizzleSalesRepository(db as never, ctx.deviceId as never, (ctx.userId as never) ?? null),
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
    default:
      return handleAccess(request);
  }
}

/** O-12's door: every op needs the booted runtime and persists afterwards. */
async function handleAccess(request: WorkerRequest): Promise<unknown> {
  if (request.method === 'vincular') {
    return runAccess(async (rt) => {
      await access.vincularBootstrap(rt.db, request.tables, request.businessId as never);
    });
  }
  if (request.method === 'autenticar') {
    return runAccess((rt) =>
      access.autenticar(
        rt.db,
        request.businessId as never,
        request.deviceId,
        request.nombre,
        request.nip,
      ),
    );
  }
  if (request.method === 'abrirCaja') {
    return runAccess((rt) =>
      access.abrirCaja(
        rt.db,
        request.businessId as never,
        request.deviceId,
        request.userId,
        BigInt(request.fondoCentavos),
      ),
    );
  }
  if (request.method === 'operadores' || request.method === 'turnoAbierto') {
    return runAccess((rt) => leerOperadores(request, rt));
  }
  if (request.method === 'productos') {
    return runAccess((rt) => catalogo(rt.db, request.businessId as never, request.deviceId));
  }
  throw new Error('unknown method');
}

function leerOperadores(
  request: {
    readonly method: 'operadores' | 'turnoAbierto';
    readonly businessId: string;
    readonly deviceId: string;
  },
  rt: Runtime,
): Promise<unknown> {
  const args = [rt.db, request.businessId as never, request.deviceId] as const;
  return request.method === 'operadores'
    ? access.operadores(...args)
    : access.turnoAbierto(...args);
}

async function runAccess<T>(fn: (rt: Runtime) => Promise<T>): Promise<T> {
  if (runtime === null) throw new Error('runtime not booted');
  try {
    return await fn(runtime);
  } finally {
    await persist();
  }
}
