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

import * as access from './access';
import { catalogo } from './catalogo';
import { abonar, cuentasDelNegocio } from './cuentas';
import { opfsRead, opfsWrite } from './opfs';
import { cancelarTicket, registrarTicket, ventasDelTurno } from './tickets';
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
    default:
      return handleAccess(request);
  }
}

/** O-12's door and O-32's Ventas: every op needs the booted runtime and persists afterwards. */
async function handleAccess(request: WorkerRequest): Promise<unknown> {
  if (
    request.method === 'vincular' ||
    request.method === 'autenticar' ||
    request.method === 'abrirCaja'
  ) {
    return runAccess((rt) => accesoBasico(request, rt));
  }
  if (request.method === 'operadores' || request.method === 'turnoAbierto') {
    return runAccess((rt) => leerOperadores(request, rt));
  }
  if (
    request.method === 'productos' ||
    request.method === 'ventas' ||
    request.method === 'cancelar'
  ) {
    return runAccess((rt) => leerOCancelar(request, rt));
  }
  if (request.method === 'cuentas' || request.method === 'abonar') {
    return runAccess((rt) => leerCuentas(request, rt));
  }
  throw new Error('unknown method');
}

/** The linking door and the turno (O-12). */
type AccesoBasicoRequest = Extract<
  WorkerRequest,
  { readonly method: 'vincular' | 'autenticar' | 'abrirCaja' }
>;

function accesoBasico(request: AccesoBasicoRequest, rt: Runtime): Promise<unknown> {
  if (request.method === 'vincular') {
    return access.vincularBootstrap(rt.db, request.tables, request.businessId as never);
  }
  if (request.method === 'autenticar') {
    return access.autenticar(
      rt.db,
      request.businessId as never,
      request.deviceId,
      request.nombre,
      request.nip,
    );
  }
  return access.abrirCaja(
    rt.db,
    request.businessId as never,
    request.deviceId,
    request.userId,
    BigInt(request.fondoCentavos),
  );
}

/** O-33's credit accounts: the read and the abono write. */
type CuentasRequest = Extract<WorkerRequest, { readonly method: 'cuentas' | 'abonar' }>;

function leerCuentas(request: CuentasRequest, rt: Runtime): Promise<unknown> {
  if (request.method === 'cuentas') {
    return cuentasDelNegocio(rt.db, request.businessId as never, request.deviceId);
  }
  return abonar(rt.db, {
    businessId: request.businessId as never,
    deviceId: request.deviceId,
    clienteId: request.clienteId as never,
    montoCentavos: BigInt(request.montoCentavos),
    metodo: request.metodo as never,
    fecha: request.fecha,
  });
}

/** The register's catalogue read and ticket cancellation (O-06/O-32). */
type TicketsRequest = Extract<
  WorkerRequest,
  { readonly method: 'productos' | 'ventas' | 'cancelar' }
>;

function leerOCancelar(request: TicketsRequest, rt: Runtime): Promise<unknown> {
  if (request.method === 'productos') {
    return catalogo(rt.db, request.businessId as never, request.deviceId);
  }
  if (request.method === 'ventas') {
    return ventasDelTurno(rt.db, request.businessId as never, request.deviceId, request.turnoId);
  }
  return cancelarTicket(rt.db, {
    businessId: request.businessId as never,
    deviceId: request.deviceId,
    userId: request.userId as never,
    ticketId: request.ticketId as never,
    pin: request.pin,
    motivo: request.motivo,
  });
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
