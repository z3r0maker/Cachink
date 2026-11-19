/**
 * useOpenCajaTurno — the caja's open CajaTurno, whoever opened it (M-18,
 * ADR-071 §3: one open turno per caja; sales attach to it).
 *
 * Returns `{ userId, openTurno, isLoading }`. `openTurno` is null when:
 *   - No user is logged in
 *   - Nobody has opened a turno on this caja yet
 *   - The caja's turno has been closed
 *
 * Shared by the shell and the Cobrar route's caja gate.
 */
import { useQuery } from '@tanstack/react-query';
import type { BusinessId, CajaTurno, UserId } from '@xangarro/domain';
import { useCajaTurnosRepository } from '../app/repository-provider';
import { useCurrentBusinessId, useUserId } from '../app-config/use-app-config';
import { cajaKeys } from './query-keys';

export function useOpenCajaTurno(): {
  userId: UserId | null;
  openTurno: CajaTurno | null;
  isLoading: boolean;
} {
  const businessId = useCurrentBusinessId();
  const userId = useUserId();
  const turnosRepo = useCajaTurnosRepository();
  const openTurnoQ = useQuery({
    queryKey: [...cajaKeys.openByUser(businessId as BusinessId | null), userId],
    queryFn: () => (businessId ? turnosRepo.findOpenByBusiness(businessId as BusinessId) : null),
    enabled: userId !== null && businessId !== null,
  });
  return {
    userId,
    openTurno: openTurnoQ.data ?? null,
    isLoading: openTurnoQ.isLoading,
  };
}
