/**
 * `useEliminarUsuario` — TanStack mutation wrapping
 * `EliminarUsuarioUseCase`. Invalidates `['users', businessId]`
 * so the QuickSwitch list and UserManagement screen update.
 *
 * Issue 6 fix — Second Audit.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { EliminarUsuarioUseCase } from '@cachink/application';
import type { BusinessId, UserId } from '@cachink/domain';
import { useUsersRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { userKeys } from './query-keys';

export type EliminarUsuarioResult = UseMutationResult<void, Error, UserId, unknown>;

export function useEliminarUsuario(): EliminarUsuarioResult {
  const users = useUsersRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<void, Error, UserId>({
    async mutationFn(userId) {
      const useCase = new EliminarUsuarioUseCase(users);
      return useCase.execute({ userId });
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: userKeys.byBusiness(businessId as BusinessId),
      });
    },
  });
}
