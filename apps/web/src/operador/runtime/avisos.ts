/**
 * Avisos, live (O-16, ADR-075): the owner's messages to this caja's operator
 * as the bootstrap and every pull left them in `mensajes_operador`, the
 * operator's replies written to `respuestas_operador` (UP: the change log
 * carries them to the owner), device-local read marks in `app_config`, and
 * the caja's own notices from its real state (the queue, refused rows, stock).
 */

import { sql } from 'drizzle-orm';
import {
  DrizzleAppConfigRepository,
  DrizzleCajaTurnosRepository,
  DrizzleMensajesOperadorRepository,
  DrizzleProductsRepository,
  DrizzleRespuestasOperadorRepository,
} from '@xangarro/data';
import type { BusinessId, MensajeOperador } from '@xangarro/domain';

import { colaPendiente } from './cola';
import type { AvisosPara, ColaRequest, MensajePara, StockBajoPara } from '@xangarro/caja/lectura';
import type { Db } from './db-types';
import { stockPorProducto } from './inventario';
import { duenoNombre } from './negocio';

/** Device-local read marks: never synced (ADR-075), so `app_config`. */
const LEIDOS = 'operador.avisosLeidos';
const MAX_LEIDOS = 500;
/** The caja lists the lowest few; Inventario has the rest. */
const MAX_STOCK = 5;

async function leidos(db: Db): Promise<readonly string[]> {
  const raw = await new DrizzleAppConfigRepository(db as never).get(LEIDOS);
  try {
    const v: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function marcarLeidos(db: Db, ids: readonly string[]): Promise<void> {
  const todos = [...new Set([...(await leidos(db)), ...ids])].slice(-MAX_LEIDOS);
  await new DrizzleAppConfigRepository(db as never).set(LEIDOS, JSON.stringify(todos));
}

async function comoMensaje(db: Db, deviceId: string, m: MensajeOperador): Promise<MensajePara> {
  const turno =
    m.cajaTurnoId === null
      ? null
      : await new DrizzleCajaTurnosRepository(db as never, deviceId as never).findById(
          m.cajaTurnoId,
        );
  const respuestas = await new DrizzleRespuestasOperadorRepository(
    db as never,
    deviceId as never,
  ).findByMensaje(m.id);
  return {
    id: m.id,
    severidad: m.severidad,
    cuerpo: m.cuerpo,
    creado: m.createdAt,
    corte: turno?.fecha ?? null,
    respuesta: respuestas.at(-1)?.texto ?? null,
  };
}

async function stockBajo(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
): Promise<readonly StockBajoPara[]> {
  const stock = await stockPorProducto(db, businessId, deviceId);
  const productos = await new DrizzleProductsRepository(
    db as never,
    deviceId as never,
  ).listForBusiness(businessId);
  return productos
    .flatMap((p) => {
      const s = stock.get(p.id);
      return s !== undefined && s.existencias <= s.umbral
        ? [{ id: p.id, nombre: p.nombre, ...s }]
        : [];
    })
    .sort((a, b) => a.existencias - b.existencias)
    .slice(0, MAX_STOCK);
}

async function rechazados(db: Db): Promise<number> {
  const rows = (await db.all(
    sql`SELECT count(*) AS n FROM __sync_row_status WHERE status = 'rejected' AND retryable = 0`,
  )) as { n: number }[];
  return Number(rows[0]?.n ?? 0);
}

export async function avisosDeCaja(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
  operadorId: string,
): Promise<AvisosPara> {
  const propios = await new DrizzleMensajesOperadorRepository(db as never).findByOperador(
    businessId,
    operadorId as never,
  );
  const mensajes: MensajePara[] = [];
  for (const m of propios.filter((x) => x.deletedAt === null)) {
    mensajes.push(await comoMensaje(db, deviceId, m));
  }
  const cola = await colaPendiente(db);
  return {
    mensajes,
    leidos: await leidos(db),
    cola: { cuantos: cola.length, desde: cola[0]?.en ?? null },
    rechazados: await rechazados(db),
    stockBajo: await stockBajo(db, businessId, deviceId),
    dueno: await duenoNombre(db),
  };
}

/** The reply: one `respuestas_operador` row (the outbox sends it), and the message read. */
export async function responderAviso(
  db: Db,
  p: Extract<ColaRequest, { readonly method: 'responderAviso' }>,
): Promise<{ readonly id: string }> {
  const texto = p.texto.trim();
  if (texto.length === 0 || texto.length > 500) throw new Error('RESPUESTA_INVALIDA');
  const r = await new DrizzleRespuestasOperadorRepository(
    db as never,
    p.deviceId as never,
    p.userId as never,
  ).create({ mensajeId: p.mensajeId as never, texto, businessId: p.businessId as never });
  await marcarLeidos(db, [p.mensajeId]);
  return { id: r.id };
}

/** The Worker's handler for Registros por enviar and Avisos. */
export function porCola(request: ColaRequest, rt: { readonly db: Db }): Promise<unknown> {
  if (request.method === 'colaPendiente') return colaPendiente(rt.db);
  if (request.method === 'avisosLeidos') return marcarLeidos(rt.db, request.ids);
  if (request.method === 'responderAviso') return responderAviso(rt.db, request);
  return avisosDeCaja(rt.db, request.businessId as never, request.deviceId, request.operadorId);
}
