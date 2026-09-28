/**
 * Avisos' read on the phone (MvAvisos, the web's O-16 read in
 * `operador/runtime/avisos.ts`, ADR-075): the owner's messages to the
 * signed-in operator as the pulls left them in `mensajes_operador`, each with
 * its corte's day and the operator's latest reply (`respuestas_operador`);
 * the device-local read marks (`app_config`, never synced); and the caja's
 * own state for «De tu caja»: the queue, the refused rows and the lowest
 * stock. Said by `avisosVivos` from `@xangarro/caja/avisos`.
 */
import type { AvisosPara, MensajePara, StockBajoPara } from '@xangarro/caja/lectura';
import type { BusinessId, MensajeOperador, UserId } from '@xangarro/domain';
import { SYNC_CONFIG_KEYS } from '@xangarro/sync';
import type { Repositories } from '../../app/repository-provider';
import { seSigue } from '../Inventario/inventario-lectura';

/** Device-local read marks, the web caja's key. */
export const LEIDOS = 'operador.avisosLeidos';
const MAX_LEIDOS = 500;
/** Avisos lists the lowest few; Inventario has the rest. */
const MAX_STOCK = 5;

type R = Pick<
  Repositories,
  | 'appConfig'
  | 'mensajesOperador'
  | 'respuestasOperador'
  | 'cajaTurnos'
  | 'products'
  | 'inventoryMovements'
>;

export async function leidos(r: Pick<R, 'appConfig'>): Promise<readonly string[]> {
  const raw = await r.appConfig.get(LEIDOS);
  try {
    const v: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function marcarLeidos(r: Pick<R, 'appConfig'>, ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  const todos = [...new Set([...(await leidos(r)), ...ids])].slice(-MAX_LEIDOS);
  await r.appConfig.set(LEIDOS, JSON.stringify(todos));
}

async function comoMensaje(r: R, m: MensajeOperador): Promise<MensajePara> {
  const [turno, respuestas] = await Promise.all([
    m.cajaTurnoId === null ? null : r.cajaTurnos.findById(m.cajaTurnoId as never),
    r.respuestasOperador.findByMensaje(m.id),
  ]);
  return {
    id: m.id,
    severidad: m.severidad,
    cuerpo: m.cuerpo,
    creado: m.createdAt,
    corte: turno?.fecha ?? null,
    respuesta: respuestas.at(-1)?.texto ?? null,
  };
}

/** The operator's messages, newest first as the repository returns them. */
export async function leerMensajes(
  r: R,
  businessId: BusinessId,
  userId: UserId,
): Promise<readonly MensajePara[]> {
  const propios = await r.mensajesOperador.findByOperador(businessId, userId);
  return Promise.all(propios.filter((m) => m.deletedAt === null).map((m) => comoMensaje(r, m)));
}

async function stockBajo(r: R, businessId: BusinessId): Promise<readonly StockBajoPara[]> {
  const productos = (await r.products.listForBusiness(businessId)).filter(seSigue);
  const conStock = await Promise.all(
    productos.map(async (p) => ({
      id: p.id,
      nombre: p.nombre,
      existencias: await r.inventoryMovements.sumStock(p.id),
      umbral: p.umbralStockBajo,
    })),
  );
  return conStock
    .filter((p) => p.existencias <= p.umbral)
    .sort((a, b) => a.existencias - b.existencias)
    .slice(0, MAX_STOCK);
}

export interface EstadoCola {
  readonly cuantos: number;
  readonly desde: string | null;
  readonly rechazados: number;
}

export async function leerAvisos(
  r: R,
  s: { readonly businessId: BusinessId; readonly userId: UserId },
  cola: EstadoCola,
): Promise<AvisosPara> {
  const [mensajes, marcas, stock, dueno] = await Promise.all([
    leerMensajes(r, s.businessId, s.userId),
    leidos(r),
    stockBajo(r, s.businessId),
    r.appConfig.get(SYNC_CONFIG_KEYS.duenoNombre),
  ]);
  return {
    mensajes,
    leidos: marcas,
    cola: { cuantos: cola.cuantos, desde: cola.desde },
    rechazados: cola.rechazados,
    stockBajo: stock,
    dueno: dueno ?? null,
  };
}
