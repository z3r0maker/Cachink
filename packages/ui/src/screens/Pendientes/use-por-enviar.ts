/**
 * usePorEnviar — the queue's data (M-09): the outbox through the one
 * definition of «por enviar» (`unsentRows`, DB3-CAJA-02), each record read
 * back the way the operator captured it (`leerCola`); the refused rows with
 * their sentences (`listRejected`, invalidated after every run); the phase
 * from the bridge the pill reads. «Reintentar envío» runs the same manual
 * flush the pill's «Actualizar» runs; a refused row's retry requeues it and
 * pushes.
 */
import { useQuery } from '@tanstack/react-query';
import { hhmmLocal } from '@xangarro/caja';
import type { RegistroEnCola, RechazoVisto } from '@xangarro/caja/pendientes';
import { describeRechazado, faseTelefono, type FaseCola } from '@xangarro/caja/pendientes';
import { unsentRows } from '@xangarro/sync';
import {
  useCajaMovimientosRepository,
  useCajaTurnosRepository,
  useCancelacionLogsRepository,
  useClientPaymentsRepository,
  useClientsRepository,
  useExpensesRepository,
  useProductsRepository,
  useRespuestasOperadorRepository,
  useSalesRepository,
  useTicketsRepository,
} from '../../app/index';
import { CLOUD_SYNC_QUERY_KEY, useCloudSync, type RowRef } from '../../app/cloud-sync-bridge';
import { useCurrentBusinessId } from '../../app-config/index';
import { useDatabase } from '../../database/index';
import { cajaKeys } from '../../hooks/query-keys';
import { leerCola } from './cola-lectura';

export interface PorEnviarVivo {
  readonly state: 'happy' | 'cargando' | 'sin-internet' | 'error';
  readonly fase: FaseCola;
  readonly cola: readonly RegistroEnCola[];
  readonly rechazados: readonly RechazoVisto[];
  /** "HH:MM" of the last run that reached the server. */
  readonly ultima: string | null;
  /** The manual flush (the pill's «Actualizar»). */
  readonly reintentar: () => void;
  /** Requeues refused rows, then flushes. */
  readonly reintentarRechazado: (xs: readonly RechazoVisto[]) => void;
  readonly refetch: () => void;
}

export function porEnviarKey(businessId: unknown): readonly unknown[] {
  return [...cajaKeys.byBusiness(businessId as never), 'por-enviar'];
}

/**
 * The queue rows, one query under the caja's family. Keyed on what a run
 * changes too (the unsent count, the last send): a push that pulls nothing
 * invalidates no caja query, and the list kept rows already sent (R3).
 */
function useCola(unsent: number, ultima: string | null) {
  const businessId = useCurrentBusinessId();
  const db = useDatabase();
  const repos = {
    tickets: useTicketsRepository(),
    sales: useSalesRepository(),
    expenses: useExpensesRepository(),
    clientPayments: useClientPaymentsRepository(),
    clients: useClientsRepository(),
    cajaMovimientos: useCajaMovimientosRepository(),
    cajaTurnos: useCajaTurnosRepository(),
    cancelacionLogs: useCancelacionLogsRepository(),
    products: useProductsRepository(),
    respuestas: useRespuestasOperadorRepository(),
  };
  return useQuery({
    queryKey: [...porEnviarKey(businessId), 'cola', unsent, ultima],
    placeholderData: (previo) => previo,
    enabled: businessId !== null,
    queryFn: async () => leerCola(repos, await unsentRows(db)),
  });
}

export function usePorEnviar(): PorEnviarVivo {
  const { state: sync, syncNow, listRejected, requeue } = useCloudSync();
  const cola = useCola(sync.counts.unsent, sync.lastSyncAt);
  const rechazados = useQuery({
    queryKey: [...CLOUD_SYNC_QUERY_KEY, 'rechazados', 'por-enviar'],
    queryFn: () => listRejected(),
  });
  const filas = cola.data ?? [];
  const negadas = (rechazados.data ?? []).map((r) => describeRechazado(r, r.row));
  return {
    state: cola.isError
      ? 'error'
      : sync.phase === 'offline'
        ? 'sin-internet'
        : cola.isLoading
          ? 'cargando'
          : 'happy',
    fase: faseTelefono(sync.phase, filas.length, negadas.filter((x) => !x.reintentando).length),
    cola: filas,
    rechazados: negadas,
    ultima: sync.lastSyncAt === null ? null : hhmmLocal(sync.lastSyncAt),
    reintentar: syncNow,
    reintentarRechazado: (xs) => {
      const refs: readonly RowRef[] = xs.map((x) => ({ tableName: x.tabla, rowId: x.fila }));
      void requeue(refs);
    },
    refetch: () => void cola.refetch(),
  };
}
