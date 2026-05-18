/**
 * `useEliminarUsuario` — TanStack mutation wrapping
 * `EliminarUsuarioUseCase`. Invalidates `['users', businessId]`
 * so the QuickSwitch list and UserManagement screen update.
 *
 * Issue 6 fix — Second Audit.
 */

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { EliminarUsuarioUseCase } from '@cachink/application';
import type { BusinessId, UserId } from '@cachink/domain';
import { useUsersRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { userKeys } from './query-keys';
import { useEmitDirectorAlert } from './use-emit-director-alert';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_ELIMINAR_USUARIO } from '../observability/audit-configs';

export type EliminarUsuarioResult = UseMutationResult<void, Error, UserId, unknown>;

export function useEliminarUsuario(): EliminarUsuarioResult {
  const users = useUsersRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  const emitAlert = useEmitDirectorAlert();

  return useAuditedMutation(MUTATION_ELIMINAR_USUARIO, {
    async mutationFn(userId) {
      const useCase = new EliminarUsuarioUseCase(users);
      return useCase.execute({ userId });
    },
    async onSuccess(_void, userId) {
      await queryClient.invalidateQueries({
        queryKey: userKeys.byBusiness(businessId as BusinessId),
      });

      // Alert: usuario-cambio
      emitAlert.mutate({
        source: 'usuario-cambio',
        severity: 'info',
        titleKey: 'notificaciones.usuarioCambio',
        message: `Se eliminó un usuario del sistema.`,
        actionRoute: '/usuarios',
        metadata: JSON.stringify({ userId, action: 'deleted' }),
      });
    },
  });
}
