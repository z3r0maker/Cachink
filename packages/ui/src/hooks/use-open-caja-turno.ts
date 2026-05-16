/**
 * useOpenCajaTurno — query the currently open CajaTurno for the logged-in user.
 *
 * Returns `{ userId, openTurno, isLoading }`. `openTurno` is null when:
 *   - No user is logged in
 *   - The user hasn't opened a turno yet
 *   - The user's turno has been closed
 *
 * Shared between CajaContent and the Ventas route caja gate.
 */
import { useQuery } from '@tanstack/react-query';
import type { BusinessId, CajaTurno, UserId } from '@cachink/domain';
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
    queryFn: () => (userId ? turnosRepo.findOpenByUser(userId) : null),
    enabled: userId !== null,
  });
  return {
    userId,
    openTurno: openTurnoQ.data ?? null,
    isLoading: openTurnoQ.isLoading,
  };
}
