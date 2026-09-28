/**
 * What Acceso and Bloqueo say around the NIP, read from the device before
 * anyone signs in: the caja's own name and the business («Caja 1 · Taquería
 * Don Pedro»), today, the owner's first name as the last pull sent it, and
 * the turno open on this caja (who holds it, since when).
 */
import { useQuery } from '@tanstack/react-query';
import { hhmmLocal } from '@xangarro/caja';
import { primerNombreDueno } from '@xangarro/caja';
import type { BusinessId, UserId } from '@xangarro/domain';
import { SYNC_CONFIG_KEYS } from '@xangarro/sync';
import { useActivationContext } from '../activation/activation-context';
import { useCurrentBusiness } from '../hooks/use-current-business';
import { cajaKeys } from '../hooks/query-keys';
import { contextoCaja, diaLargo } from '../screens/Inicio/sesion';
import { useAppConfigRepository, useCajaTurnosRepository } from './repository-provider';

export interface AccesoContexto {
  readonly contexto: string | null;
  readonly fecha: string;
  readonly dueno: string | null;
  readonly turno: { readonly userId: UserId; readonly desde: string } | null;
}

export function useAccesoContexto(businessId: BusinessId): AccesoContexto {
  const { config } = useActivationContext();
  const negocio = useCurrentBusiness().data?.nombre ?? null;
  const appConfig = useAppConfigRepository();
  const turnos = useCajaTurnosRepository();
  const duenoQ = useQuery({
    queryKey: ['acceso', 'dueno', businessId],
    queryFn: () => appConfig.get(SYNC_CONFIG_KEYS.duenoNombre),
  });
  const turnoQ = useQuery({
    queryKey: [...cajaKeys.byBusiness(businessId), 'acceso-turno'],
    queryFn: () => turnos.findOpenByBusiness(businessId),
  });
  const t = turnoQ.data ?? null;
  return {
    contexto: contextoCaja(config.deviceInfo.name.trim() || null, negocio),
    fecha: diaLargo(new Date()),
    dueno: primerNombreDueno(duenoQ.data ?? null),
    turno: t ? { userId: t.userId, desde: hhmmLocal(t.aperturaAt) } : null,
  };
}
