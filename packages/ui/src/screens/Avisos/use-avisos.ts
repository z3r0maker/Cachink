/**
 * useAvisos — Avisos' data for the signed-in operator (M-09), the same read
 * the web caja's worker does (`operador/runtime/avisos.ts`): the owner's
 * messages with their replies, device-local read marks (`app_config`, never
 * synced, ADR-075), and «De tu caja» from the caja's real state (the queue,
 * refused rows, low stock). The reply writes one `respuestas_operador` row
 * the outbox carries to the owner; every query sits under the caja's family
 * so a capture or a sync run refreshes it. What is stored shows offline and
 * after a failed run (R6): only a failed read is an error, and offline is a
 * flag, so a reply then says it waits for the signal. The read follows each
 * sync run, so the queue notice leaves once the rows are sent.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hoyLocal } from '@xangarro/caja';
import type { AvisosPara, MensajePara, StockBajoPara } from '@xangarro/caja/lectura';
import { avisosVivos, type AvisosData, type AvisosVivo } from '@xangarro/caja/avisos';
import { unsentRows } from '@xangarro/sync';
import type {
  AppConfigRepository,
  CajaTurnosRepository,
  InventoryMovementsRepository,
  MensajesOperadorRepository,
  ProductsRepository,
  RespuestasOperadorRepository,
} from '@xangarro/data';
import type { BusinessId, MensajeOperadorId, UserId } from '@xangarro/domain';
import {
  useAppConfigRepository,
  useCajaTurnosRepository,
  useInventoryMovementsRepository,
  useMensajesOperadorRepository,
  useProductsRepository,
  useRespuestasOperadorRepository,
} from '../../app/index';
import { useCurrentBusinessId } from '../../app-config/index';
import { useUserId } from '../../app-config/use-app-config';
import { CLOUD_SYNC_QUERY_KEY, useCloudSync } from '../../app/cloud-sync-bridge';
import { useDatabase } from '../../database/index';
import { cajaKeys } from '../../hooks/query-keys';

/** Device-local read marks: the web's same key, never synced (ADR-075). */
const LEIDOS = 'operador.avisosLeidos';
const MAX_LEIDOS = 500;
const MAX_STOCK = 5;

export interface AvisosVivoUi {
  readonly state: 'cargando' | 'error' | 'happy' | 'sin-internet';
  readonly data: AvisosData | null;
  /** The last run had no network: the screen still shows what is stored. */
  readonly sinInternet: boolean;
  readonly vivo: AvisosVivo;
  readonly refetch: () => void;
}

interface Lectores {
  readonly mensajes: MensajesOperadorRepository;
  readonly respuestas: RespuestasOperadorRepository;
  readonly turnos: CajaTurnosRepository;
  readonly products: ProductsRepository;
  readonly inventory: InventoryMovementsRepository;
  readonly appConfig: AppConfigRepository;
}

async function leerLeidos(appConfig: AppConfigRepository): Promise<readonly string[]> {
  try {
    const v: unknown = JSON.parse((await appConfig.get(LEIDOS)) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

async function leerMensajes(
  l: Lectores,
  businessId: BusinessId,
  userId: UserId,
): Promise<readonly MensajePara[]> {
  const propios = (await l.mensajes.findByOperador(businessId, userId)).filter(
    (m) => m.deletedAt === null,
  );
  return Promise.all(
    propios.map(async (m): Promise<MensajePara> => {
      const respuestas = await l.respuestas.findByMensaje(m.id);
      const turno = m.cajaTurnoId === null ? null : await l.turnos.findById(m.cajaTurnoId);
      return {
        id: m.id,
        severidad: m.severidad,
        cuerpo: m.cuerpo,
        creado: m.createdAt,
        corte: turno?.fecha ?? null,
        respuesta: respuestas.at(-1)?.texto ?? null,
      };
    }),
  );
}

async function leerStockBajo(
  l: Lectores,
  businessId: BusinessId,
): Promise<readonly StockBajoPara[]> {
  const items = await Promise.all(
    (await l.products.listForBusiness(businessId)).map(async (p): Promise<StockBajoPara | null> => {
      const existencias = await l.inventory.sumStock(p.id);
      return existencias <= p.umbralStockBajo
        ? { id: p.id, nombre: p.nombre, existencias, umbral: p.umbralStockBajo }
        : null;
    }),
  );
  return items
    .flatMap((x) => (x === null ? [] : [x]))
    .sort((a, b) => a.existencias - b.existencias)
    .slice(0, MAX_STOCK);
}

async function leerAvisos(
  l: Lectores,
  businessId: BusinessId,
  userId: UserId,
  listRejected: () => Promise<readonly { readonly retryable: boolean }[]>,
  db: Parameters<typeof unsentRows>[0],
): Promise<AvisosData> {
  const [ms, leidos, cola, rechazados, stock] = await Promise.all([
    leerMensajes(l, businessId, userId),
    leerLeidos(l.appConfig),
    unsentRows(db),
    listRejected(),
    leerStockBajo(l, businessId),
  ]);
  const para: AvisosPara = {
    mensajes: ms,
    leidos,
    cola: { cuantos: cola.length, desde: null },
    rechazados: rechazados.filter((r) => !r.retryable).length,
    stockBajo: stock,
  };
  return avisosVivos(para, hoyLocal(), 'esta caja');
}

async function marcarLeidos(l: Lectores, ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  const todos = [...new Set([...(await leerLeidos(l.appConfig)), ...ids])].slice(-MAX_LEIDOS);
  await l.appConfig.set(LEIDOS, JSON.stringify(todos));
}

/** The read (one query under the caja's family) and the state it lands in. */
function useAvisosData(
  l: Lectores,
  businessId: BusinessId | null,
  userId: UserId | null,
): {
  readonly state: AvisosVivoUi['state'];
  readonly data: AvisosData | null;
  readonly sinInternet: boolean;
  readonly refetch: () => void;
} {
  const db = useDatabase();
  const { state: sync, listRejected } = useCloudSync();
  // Keyed on what a run changes too: a push that pulls nothing invalidates no
  // caja query, and the queue notice outlived the send (as the queue did, R3).
  const corrida = [sync.counts.unsent, sync.lastSyncAt] as const;
  const q = useQuery({
    queryKey: [...cajaKeys.byBusiness(businessId), 'avisos', userId, ...corrida],
    placeholderData: (previo) => previo,
    enabled: businessId !== null && userId !== null,
    queryFn: () => leerAvisos(l, businessId as BusinessId, userId as UserId, listRejected, db),
  });
  // The read is the device's own: a sync run that failed or found no network
  // changes nothing stored, so it never hides the messages (R6).
  const state: AvisosVivoUi['state'] = q.isError ? 'error' : q.data == null ? 'cargando' : 'happy';
  return {
    state,
    data: q.data ?? null,
    sinInternet: sync.phase === 'offline',
    refetch: () => void q.refetch(),
  };
}

/** The write path: marks device-local, the reply an outbox row. */
function useAvisosAcciones(
  l: Lectores,
  businessId: BusinessId | null,
  refrescar: () => Promise<unknown>,
): AvisosVivo {
  const escribir = useMutation({
    mutationFn: async (x: { readonly mensajeId: string; readonly texto: string }) => {
      if (businessId === null) throw new Error('No hay negocio en esta caja');
      const texto = x.texto.trim();
      if (texto.length === 0 || texto.length > 500) throw new Error('RESPUESTA_INVALIDA');
      await l.respuestas.create({ mensajeId: x.mensajeId as MensajeOperadorId, texto, businessId });
    },
  });
  return {
    marcar: (ids) => {
      void marcarLeidos(l, ids).then(refrescar);
    },
    responder: async (mensajeId, texto) => {
      await escribir.mutateAsync({ mensajeId, texto });
      await marcarLeidos(l, [mensajeId]);
      await refrescar();
    },
  };
}

export function useAvisos(): AvisosVivoUi {
  const businessId = useCurrentBusinessId();
  const userId = useUserId();
  const queryClient = useQueryClient();
  const l: Lectores = {
    mensajes: useMensajesOperadorRepository(),
    respuestas: useRespuestasOperadorRepository(),
    turnos: useCajaTurnosRepository(),
    products: useProductsRepository(),
    inventory: useInventoryMovementsRepository(),
    appConfig: useAppConfigRepository(),
  };
  const leer = useAvisosData(l, businessId, userId);
  const refrescar = (): Promise<unknown> =>
    queryClient.invalidateQueries({ queryKey: cajaKeys.byBusiness(businessId) });
  const vivo = useAvisosAcciones(l, businessId, refrescar);
  return {
    ...leer,
    vivo,
    refetch: () => {
      void queryClient.invalidateQueries({ queryKey: CLOUD_SYNC_QUERY_KEY });
      leer.refetch();
    },
  };
}
