/**
 * useMiTurno — the /turno tab's data (Track M, M-09): the open turno read
 * from the phone's own rows (`leerTurnoVivo`) and shaped by `comoTurno`
 * (`@xangarro/caja`), with the session's names around it and the sync
 * counts for the «por enviar» band. Keyed under the caja's queries, so
 * anything captured or synced refreshes it.
 */
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hoyLocal } from '@xangarro/caja';
import { comoTurno, type TurnoData } from '@xangarro/caja/turno';
import type { BusinessId, UserId } from '@xangarro/domain';
import { useActivationState } from '../../activation/index';
import { useRepositories } from '../../app/repository-provider';
import { useCurrentBusinessId, useUserId } from '../../app-config/use-app-config';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { cajaKeys } from '../../hooks/query-keys';
import { useShellData } from '../AppShell/use-shell-data';
import { leerTurnoVivo } from './mi-turno-lectura';
import type { ColaCierre } from './cierre-banda';
import type { MiTurnoEstado } from './mi-turno-estados';

export interface MiTurnoVivo {
  readonly state: MiTurnoEstado;
  readonly data: TurnoData | null;
  /** The queue, as the band counts it. */
  readonly cola: ColaCierre;
  readonly refetch: () => void;
}

export function miTurnoKey(
  businessId: BusinessId | null,
  userId: UserId | null,
): readonly unknown[] {
  return [...cajaKeys.byBusiness(businessId), 'mi-turno', userId];
}

/** The sync counts as the band reads them; the pill's own words are theirs. */
export function useColaCierre(): ColaCierre {
  const { state, syncNow } = useCloudSync();
  const { counts } = state;
  return {
    porEnviar: counts.unsent,
    reintentando: counts.retrying,
    sinRed: state.phase === 'offline',
    enviando: state.phase === 'syncing',
    onReintentar: syncNow,
  };
}

/** The screen's state from the query's and the session's: sin-turno said
 *  apart from loading and from a turno with nothing captured yet. */
export function estadoMiTurno(
  q: { readonly isError: boolean; readonly data?: { readonly turnoId: string } | null },
  tieneOperador: boolean,
  data: TurnoData | null,
): MiTurnoEstado {
  if (q.isError) return 'error';
  if (q.data === undefined || !tieneOperador) return 'loading';
  if (q.data === null) return 'sin-turno';
  return data !== null && data.movimientos.length === 0 ? 'empty' : 'happy';
}

export function useMiTurno(): MiTurnoVivo {
  const repos = useRepositories();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const userId = useUserId();
  const shell = useShellData();
  const cola = useColaCierre();
  const deviceId = useActivationState().record?.deviceId ?? '';
  const q = useQuery({
    queryKey: [...miTurnoKey(businessId, userId), hoyLocal()],
    queryFn: () => leerTurnoVivo(repos, businessId as BusinessId, userId as UserId, deviceId),
    enabled: businessId !== null && userId !== null,
  });
  const data =
    q.data !== null && q.data !== undefined && shell.operador !== null
      ? comoTurno(q.data.vivo, shell.operador.nombre, shell.caja ?? 'Caja')
      : null;
  const { refetch } = q;
  const recargar = useCallback(() => void refetch(), [refetch]);
  return { state: estadoMiTurno(q, shell.operador !== null, data), data, cola, refetch: recargar };
}
