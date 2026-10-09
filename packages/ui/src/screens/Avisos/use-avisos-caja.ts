/**
 * Avisos' data and actions on the phone (M-09; the web's `avisos/viva.tsx`):
 * the read (`leerAvisos`) said by `avisosVivos`, plus the late fiado
 * accounts (`avisosAtrasados`) from Fiado y abonos' read and the queue from
 * Registros por enviar's. Marking read writes the device-local marks; a reply
 * is one `respuestas_operador` row that the outbox carries to the owner, sent
 * right away when there is internet. Everything is keyed under `avisos`, so
 * the header bell recounts after a mark or a reply.
 */
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hoyLocal } from '@xangarro/caja';
import {
  avisosAtrasados,
  avisosVivos,
  DUENO_GENERICO,
  type AvisosData,
} from '@xangarro/caja/avisos';
import { comoCuenta } from '@xangarro/caja/cobranza/vivo';
import type { BusinessId, UserId } from '@xangarro/domain';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { useRepositories } from '../../app/repository-provider';
import { useCurrentBusinessId, useUserId } from '../../app-config/use-app-config';
import { useCuentasPara } from '../Cobranza/use-cuentas';
import { useColaPendiente } from '../Pendientes/use-cola';
import { useRejectedRows } from '../SyncRejected/use-rejected-rows';
import { leerAvisos, marcarLeidos } from './avisos-lectura';

export const avisosKey = (b: BusinessId | null, u: UserId | null) => ['avisos', b, u] as const;

export interface AvisosCaja {
  readonly state: 'loading' | 'error' | 'empty' | 'happy';
  readonly data: AvisosData;
  readonly marcar: (ids: readonly string[]) => void;
  readonly responder: (mensajeId: string, texto: string) => Promise<void>;
  readonly refetch: () => void;
}

function useEstadoCola() {
  const cola = useColaPendiente().data ?? [];
  const { rows } = useRejectedRows();
  return {
    cuantos: cola.length,
    desde: cola[0]?.en ?? null,
    rechazados: rows.filter((r) => !r.retryable).length,
  };
}

function useAcciones(businessId: BusinessId | null) {
  const repos = useRepositories();
  const qc = useQueryClient();
  const { syncNow } = useCloudSync();
  const refrescar = () => qc.invalidateQueries({ queryKey: ['avisos', businessId] });
  const marcar = useMutation({
    mutationFn: (ids: readonly string[]) => marcarLeidos(repos, ids),
    onSuccess: refrescar,
  });
  const responder = useMutation({
    mutationFn: async (p: { mensajeId: string; texto: string }) => {
      const texto = p.texto.trim();
      if (texto.length === 0 || texto.length > 500) throw new Error('RESPUESTA_INVALIDA');
      await repos.respuestasOperador.create({
        mensajeId: p.mensajeId as never,
        texto,
        businessId: businessId as BusinessId,
      });
      await marcarLeidos(repos, [p.mensajeId]);
    },
    onSuccess: async () => {
      await refrescar();
      syncNow();
    },
  });
  return { marcar, responder };
}

/** The read, with the queue and the late accounts said alongside. */
function useDatos(businessId: BusinessId | null, userId: UserId | null) {
  const repos = useRepositories();
  const hoy = hoyLocal();
  const cola = useEstadoCola();
  const cuentas = useCuentasPara().data;
  const q = useQuery({
    queryKey: [...avisosKey(businessId, userId), 'todo', hoy],
    queryFn: () =>
      leerAvisos(repos, { businessId: businessId as BusinessId, userId: userId as UserId }, cola),
    enabled: businessId !== null && userId !== null,
  });
  const data = useMemo<AvisosData | null>(() => {
    if (q.data === undefined) return null;
    const a = {
      ...q.data,
      cola: { cuantos: cola.cuantos, desde: cola.desde },
      rechazados: cola.rechazados,
    };
    const vivos = avisosVivos(a, hoy, 'esta caja');
    const tarde = (cuentas ?? []).map((c) => comoCuenta(c, hoy));
    return { ...vivos, avisos: [...vivos.avisos, ...avisosAtrasados(tarde, hoy, a.leidos)] };
  }, [q.data, cola.cuantos, cola.desde, cola.rechazados, cuentas, hoy]);
  return { q, data };
}

function estadoDe(error: boolean, data: AvisosData | null): AvisosCaja['state'] {
  if (error) return 'error';
  if (data === null) return 'loading';
  return data.avisos.length === 0 ? 'empty' : 'happy';
}

export function useAvisosCaja(): AvisosCaja {
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const userId = useUserId() as UserId | null;
  const { q, data } = useDatos(businessId, userId);
  const { marcar, responder } = useAcciones(businessId);
  return {
    state: estadoDe(q.isError, data),
    data: data ?? { dueno: DUENO_GENERICO, avisos: [] },
    marcar: (ids) => {
      if (ids.length > 0) marcar.mutate(ids);
    },
    responder: async (mensajeId, texto) => {
      await responder.mutateAsync({ mensajeId, texto });
    },
    refetch: () => void q.refetch(),
  };
}
