/**
 * useOtherOpenTurno — checks if another user already has an open caja turn.
 *
 * Used by CajaContent to show the handoff banner when e.g. a Director
 * already opened the caja and the Operador logs in on the same device.
 *
 * QA Bug Fix #11.
 */

import { useQuery } from '@tanstack/react-query';
import type { BusinessId, CajaTurno, UserId } from '@cachink/domain';
import { useCajaTurnosRepository, useUsersRepository } from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/use-app-config';
import { cajaKeys } from '../../hooks/query-keys';

export function useOtherOpenTurno(currentUserId: UserId | null): {
  otherTurno: CajaTurno | null;
  otherUserName: string | null;
} {
  const businessId = useCurrentBusinessId();
  const turnosRepo = useCajaTurnosRepository();
  const usersRepo = useUsersRepository();
  const turnoQ = useQuery({
    queryKey: [...cajaKeys.byBusiness(businessId as BusinessId | null), 'open-other'],
    queryFn: () =>
      businessId ? turnosRepo.findOpenByBusiness(businessId as BusinessId) : null,
    enabled: businessId !== null,
  });
  const otherTurno =
    turnoQ.data && currentUserId && turnoQ.data.userId !== currentUserId
      ? turnoQ.data
      : null;
  const userQ = useQuery({
    queryKey: ['user', otherTurno?.userId],
    queryFn: () => (otherTurno ? usersRepo.findById(otherTurno.userId) : null),
    enabled: otherTurno !== null,
  });
  return {
    otherTurno,
    otherUserName: userQ.data?.nombre ?? null,
  };
}
