/**
 * useNombreDe — an operator's name by id, from the users the portal synced
 * down. Null while it loads, for no id, or for an operator the device does
 * not know. Mi turno and the «turno de otra persona» screen name whoever
 * opened the caja's turno with it (M-18).
 */
import { useQuery } from '@tanstack/react-query';
import type { UserId } from '@xangarro/domain';

import { useUsersRepository } from '../app/repository-provider';

export function useNombreDe(userId: string | null): string | null {
  const users = useUsersRepository();
  const q = useQuery({
    queryKey: ['usuarios', 'nombre', userId],
    queryFn: async () => (await users.findById(userId as UserId))?.nombre ?? null,
    enabled: userId !== null,
  });
  return userId === null ? null : (q.data ?? null);
}
