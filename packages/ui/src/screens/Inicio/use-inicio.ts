/**
 * useInicio — Inicio's data for the signed-in operator: the rows
 * (`leerFilasInicio`) said by `inicioMovil`, with the session around them
 * (their name, the caja, the business, the owner's name from the last pull)
 * and the sync state (offline, what waits to be sent). Keyed under the
 * caja's queries, so opening or closing a turno refreshes it.
 */
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hoyLocal } from '@xangarro/caja';
import type { InicioData } from '@xangarro/caja/inicio';
import type { BusinessId, UserId } from '@xangarro/domain';
import { SYNC_CONFIG_KEYS } from '@xangarro/sync';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { useRepositories } from '../../app/repository-provider';
import { useCurrentBusinessId, useUserId } from '../../app-config/use-app-config';
import { cajaKeys } from '../../hooks/query-keys';
import { useTranslation } from '../../i18n/index';
import { useShellData } from '../AppShell/use-shell-data';
import { inicioMovil } from './inicio-filas';
import { leerFilasInicio } from './inicio-lectura';

export interface InicioVivo {
  readonly state: 'loading' | 'error' | 'happy';
  readonly data: InicioData | null;
  readonly refetch: () => void;
}

export function inicioKey(
  businessId: BusinessId | null,
  userId: UserId | null,
): readonly unknown[] {
  return [...cajaKeys.byBusiness(businessId), 'inicio', userId];
}

function useDueno(): string | null {
  const { appConfig } = useRepositories();
  const q = useQuery({
    queryKey: ['inicio', 'dueno'],
    queryFn: () => appConfig.get(SYNC_CONFIG_KEYS.duenoNombre),
  });
  return q.data ?? null;
}

export function useInicio(): InicioVivo {
  const { t } = useTranslation();
  const repos = useRepositories();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const userId = useUserId();
  const shell = useShellData();
  const dueno = useDueno();
  const { state: sync } = useCloudSync();
  const hoy = hoyLocal();
  const q = useQuery({
    queryKey: [...inicioKey(businessId, userId), hoy],
    queryFn: () => leerFilasInicio(repos, businessId as BusinessId, userId as UserId, hoy),
    enabled: businessId !== null && userId !== null,
  });
  const data =
    q.data && shell.operador
      ? inicioMovil(
          q.data,
          {
            nombre: shell.operador.nombre,
            negocio: shell.negocio,
            caja: shell.caja ?? t('shell.cajaSinNombre'),
            offline: sync.phase === 'offline',
            pendientes: sync.counts.pending + sync.counts.retrying,
            ahora: new Date(),
            dueno,
          },
          hoy,
        )
      : null;
  const state = q.isError ? 'error' : data === null ? 'loading' : 'happy';
  const { refetch } = q;
  const recargar = useCallback(() => void refetch(), [refetch]);
  return { state, data, refetch: recargar };
}
