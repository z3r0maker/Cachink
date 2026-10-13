/**
 * useCierreTurno — Cierre's data and its write (Track M, M-09): the open
 * turno's close figures read from the phone's own rows (the same
 * `leerTurnoVivo` Mi turno reads, so the figures agree) and shaped by
 * `comoCierre`, the queue for the band, and the close itself through
 * `CerrarCajaUseCase` — the same use case the web's register closes with
 * (O-36), the reason already mapped onto the domain's enum. The write never
 * waits for the queue (ADR-123): the esperado comes from this caja's own
 * rows, all of them here.
 */
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CerrarCajaUseCase } from '@xangarro/application';
import { nombreDueno, hoyLocal, horaLocal } from '@xangarro/caja';
import { comoCierre, type CierreData } from '@xangarro/caja/cierre';
import { SYNC_CONFIG_KEYS } from '@xangarro/sync';
import type { BusinessId, UserId } from '@xangarro/domain';
import { useActivationState } from '../../activation/index';
import { useRepositories } from '../../app/repository-provider';
import { useCurrentBusinessId, useUserId } from '../../app-config/use-app-config';
import { cajaKeys } from '../../hooks/query-keys';
import { useShellData } from '../AppShell/use-shell-data';
import { leerTurnoVivo } from './mi-turno-lectura';
import { miTurnoKey, useColaCierre } from './use-mi-turno';
import type { CargaCierre } from './cierre-screen';
import type { CierreEstado } from './cierre-estados';

export interface CierreTurnoVivo {
  readonly state: CierreEstado;
  readonly data: CierreData | null;
  readonly cola: ReturnType<typeof useColaCierre>;
  /** The close write; resolves the error to show, or null once closed. */
  readonly cerrar: (c: CargaCierre) => Promise<string | null>;
  readonly refetch: () => void;
}

function useDueno(): string {
  const { appConfig } = useRepositories();
  const q = useQuery({
    queryKey: ['cierre', 'dueno'],
    queryFn: () => appConfig.get(SYNC_CONFIG_KEYS.duenoNombre),
  });
  return nombreDueno(q.data ?? null);
}

/** The close: `CerrarCajaUseCase` over the phone's own repositories. */
function useCerrarCaja(turnoId: string | null) {
  const repos = useRepositories();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const queryClient = useQueryClient();
  return useCallback(
    async (c: CargaCierre): Promise<string | null> => {
      if (businessId === null || turnoId === null) {
        return 'No hay un turno abierto en esta caja.';
      }
      const uc = new CerrarCajaUseCase(
        repos.cajaTurnos,
        repos.tickets,
        repos.sales,
        repos.expenses,
        repos.clientPayments,
      );
      try {
        await uc.execute({ ...c, turnoId: turnoId as never, businessId });
      } catch (e: unknown) {
        return `No se pudo cerrar el turno: ${e instanceof Error ? e.message : String(e)}`;
      }
      await queryClient.invalidateQueries({ queryKey: cajaKeys.byBusiness(businessId) });
      return null;
    },
    [repos, businessId, turnoId, queryClient],
  );
}

/** The screen's state from the query's and the session's. */
function estadoCierre(
  q: { readonly isError: boolean; readonly data?: { readonly turnoId: string } | null },
  tieneOperador: boolean,
): CierreEstado {
  if (q.isError) return 'error';
  if (q.data === undefined || !tieneOperador) return 'loading';
  return q.data === null ? 'sin-turno' : 'happy';
}

export function useCierreTurno(): CierreTurnoVivo {
  const repos = useRepositories();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const userId = useUserId();
  const shell = useShellData();
  const cola = useColaCierre();
  const dueno = useDueno();
  const deviceId = useActivationState().record?.deviceId ?? '';
  const q = useQuery({
    queryKey: [...miTurnoKey(businessId, userId), hoyLocal(), 'cierre'],
    queryFn: () => leerTurnoVivo(repos, businessId as BusinessId, userId as UserId, deviceId),
    enabled: businessId !== null && userId !== null,
  });
  const data =
    q.data !== null && q.data !== undefined && shell.operador !== null
      ? comoCierre(q.data.vivo.cierre, {
          operador: shell.operador.nombre,
          caja: shell.caja ?? 'Caja',
          hasta: horaLocal(),
          dueno,
          ...(shell.negocio === null ? {} : { negocio: shell.negocio }),
        })
      : null;
  const cerrar = useCerrarCaja(q.data?.turnoId ?? null);
  const { refetch } = q;
  const recargar = useCallback(() => void refetch(), [refetch]);
  return { state: estadoCierre(q, shell.operador !== null), data, cola, cerrar, refetch: recargar };
}
