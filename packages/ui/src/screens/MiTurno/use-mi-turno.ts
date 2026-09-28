/**
 * useMiTurno — Mi turno's data for the signed-in operator: Inicio's rows
 * (the same query, so the two tabs share one read and one refresh) said by
 * `miTurnoMovil`, the rows' live lines from `filasVivas`, and the queue as
 * the header pill counts it (ADR-123).
 */
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hoyLocal } from '@xangarro/caja';
import type { BusinessId, UserId } from '@xangarro/domain';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { useRepositories } from '../../app/repository-provider';
import { useCurrentBusinessId, useUserId } from '../../app-config/use-app-config';
import { useTranslation } from '../../i18n/index';
import type { TurnoRowsVivas } from '../AppShell/turno-nav';
import { useShellData } from '../AppShell/use-shell-data';
import { leerFilasInicio } from '../Inicio/inicio-lectura';
import { inicioKey } from '../Inicio/use-inicio';
import { filasVivas, miTurnoMovil, type MiTurnoVista } from './mi-turno-vista';

export type MiTurnoState = 'loading' | 'error' | 'sin-turno' | 'happy';

export interface MiTurnoVivo {
  readonly state: MiTurnoState;
  readonly vista: MiTurnoVista | null;
  readonly vivas: TurnoRowsVivas;
  readonly refetch: () => void;
}

function estadoDe(error: boolean, cargado: boolean, vista: MiTurnoVista | null): MiTurnoState {
  if (error) return 'error';
  if (!cargado) return 'loading';
  return vista === null ? 'sin-turno' : 'happy';
}

export function useMiTurno(): MiTurnoVivo {
  const { t } = useTranslation();
  const repos = useRepositories();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const userId = useUserId();
  const shell = useShellData();
  const { state: sync } = useCloudSync();
  const hoy = hoyLocal();
  const q = useQuery({
    queryKey: [...inicioKey(businessId, userId), hoy],
    queryFn: () => leerFilasInicio(repos, businessId as BusinessId, userId as UserId, hoy),
    enabled: businessId !== null && userId !== null,
  });
  const operador = shell.operador?.nombre ?? null;
  const vista =
    q.data && operador
      ? miTurnoMovil(q.data, {
          operador,
          caja: shell.caja ?? t('shell.cajaSinNombre'),
          hoy,
          ahora: new Date(),
        })
      : null;
  const cola = { porEnviar: sync.counts.unsent, rechazados: sync.counts.rejected };
  const { refetch } = q;
  const recargar = useCallback(() => void refetch(), [refetch]);
  return {
    state: estadoDe(q.isError, q.data !== undefined && operador !== null, vista),
    vista,
    vivas: vista ? filasVivas(vista, cola) : {},
    refetch: recargar,
  };
}
