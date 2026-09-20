import type { APIRequestContext } from '@playwright/test';
import { API_PATHS, deviceHeaders, encodeJson } from '@xangarro/contracts';
import { newUlid } from '@xangarro/domain';
import postgres from 'postgres';

/**
 * A phone, for the sync spec: activated through the real `/activate`, then
 * pushing and pulling over HTTP exactly as the app will.
 */
export const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
export const TACO = '01HZ8XQN9GZJXV8AKQ5X0PTAC1';
export const CNF = '01HZ8XQN9GZJXV8AKQ5X0CNF01';
export const CNF_PRODUCT = '01HZ8XQN9GZJXV8AKQ5X0CNFP1';

export async function asTenant<T>(biz: string, fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${biz}, false)`;
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export interface Phone {
  readonly token: string;
  readonly deviceId: string;
  readonly cursor: number;
}

/** Frees Taquería's slots, then activates a phone with a code minted for it. */
export async function activatePhone(request: APIRequestContext, code: string): Promise<Phone> {
  await asTenant(BIZ, async (sql) => {
    await sql`DELETE FROM activation_codes WHERE code = ${code}`;
    await sql`
      INSERT INTO activation_codes (code, email, expires_at, business_id, created_at, updated_at)
      VALUES (${code}, 'pedro@taqueria.mx', now() + interval '1 hour', ${BIZ}, now(), now())`;
  });
  const r = await request.post(API_PATHS.activate, {
    headers: deviceHeaders(),
    data: {
      email: 'pedro@taqueria.mx',
      code,
      device: { name: code, platform: 'android', appVersion: '0.1.0', osVersion: '15' },
    },
  });
  if (r.status() !== 200) throw new Error(`activate ${r.status()}: ${await r.text()}`);
  const body = await r.json();
  return { token: body.deviceToken, deviceId: body.deviceId, cursor: body.bootstrap.serverSeq };
}

export const push = (request: APIRequestContext, phone: Phone, deltas: unknown[]) =>
  request.post(API_PATHS.syncPush, {
    headers: deviceHeaders(phone.token),
    data: encodeJson({ deltas }),
  });

export async function pull(request: APIRequestContext, phone: Phone, since: number) {
  const r = await request.get(`${API_PATHS.syncPull}?since=${since}`, {
    headers: deviceHeaders(phone.token),
  });
  if (r.status() !== 200) throw new Error(`pull ${r.status()}: ${await r.text()}`);
  return r.json();
}

const AT = '2026-09-17T18:30:00.000Z';
const audit = (phone: Phone) => ({
  businessId: BIZ,
  deviceId: phone.deviceId,
  createdByUserId: null,
  createdAt: AT,
  updatedAt: AT,
  deletedAt: null,
});

/** Folios are unique per device (ADR-073); one counter per run keeps them apart. */
let folio = 0;

/** A ticket header (ADR-073): method, cash received and change live here now. */
export function ticket(phone: Phone, over: Record<string, unknown> = {}) {
  folio += 1;
  const row = {
    id: newUlid(),
    folio,
    fecha: '2026-09-17',
    hora: '12:30',
    concepto: 'Venta E2E',
    metodo: 'Efectivo',
    clienteId: null,
    estadoPago: 'pagado',
    efectivoRecibidoCentavos: 5000n,
    cambioCentavos: 500n,
    cajaTurnoId: null,
    cancelMotivo: null,
    cancelledByUserId: null,
    cancelledAt: null,
    ...audit(phone),
    ...over,
  };
  return { table: 'tickets', rowId: row.id, op: 'insert', clientSeq: 1, row };
}

/** A sale line (ADR-073): it belongs to a ticket pushed in the same batch. */
export function sale(phone: Phone, ticketId: string, over: Record<string, unknown> = {}) {
  const id = newUlid();
  const row = {
    id,
    ticketId,
    fecha: '2026-09-17',
    concepto: `Venta E2E ${id.slice(-4)}`,
    categoria: 'Producto',
    monto: 4500n,
    productoId: TACO,
    cantidad: 3,
    ...audit(phone),
    ...over,
  };
  return { table: 'sales', rowId: row.id, op: 'insert', clientSeq: 1, row };
}

export function client(phone: Phone, nombre: string) {
  const row = { id: newUlid(), nombre, telefono: null, email: null, nota: null, ...audit(phone) };
  return { table: 'clients', rowId: row.id, op: 'insert', clientSeq: 1, row };
}
