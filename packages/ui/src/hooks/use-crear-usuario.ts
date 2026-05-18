/**
 * `useCrearUsuario` — TanStack mutation wrapping `CrearUsuarioUseCase`.
 * Invalidates `['users', businessId]` so the QuickSwitch user list
 * and UserManagement screen update.
 *
 * Issue 6 fix — Second Audit.
 * ADR-049: PIN for login, Password for recovery.
 */

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { CrearUsuarioUseCase } from '@cachink/application';
import type { BusinessId, User, UserRole } from '@cachink/domain';
import { useUsersRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { userKeys } from './query-keys';
import { useEmitDirectorAlert } from './use-emit-director-alert';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_CREAR_USUARIO } from '../observability/audit-configs';

export interface CrearUsuarioHookInput {
  readonly nombre: string;
  readonly email?: string;
  readonly pin: string;
  readonly recoveryPassword: string;
  readonly role: UserRole;
  /** Defaults to `true` (temp PIN). */
  readonly mustChangePin?: boolean;
}

export type CrearUsuarioResult = UseMutationResult<User, Error, CrearUsuarioHookInput, unknown>;

export function useCrearUsuario(): CrearUsuarioResult {
  const users = useUsersRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  const emitAlert = useEmitDirectorAlert();

  return useAuditedMutation(MUTATION_CREAR_USUARIO, {
    async mutationFn(input) {
      if (!businessId) {
        throw new Error('useCrearUsuario: no current business set');
      }
      // Yield one frame so React paints the loading spinner before bcrypt blocks
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const useCase = new CrearUsuarioUseCase(users);
      return useCase.execute({
        nombre: input.nombre,
        email: input.email,
        pin: input.pin,
        recoveryPassword: input.recoveryPassword,
        role: input.role,
        mustChangePin: input.mustChangePin ?? true,
        businessId: businessId as BusinessId,
      });
    },
    async onSuccess(user) {
      await queryClient.invalidateQueries({
        queryKey: userKeys.byBusiness(businessId as BusinessId),
      });

      // Alert: usuario-cambio
      emitAlert.mutate({
        source: 'usuario-cambio',
        severity: 'info',
        titleKey: 'notificaciones.usuarioCambio',
        message: `Se creó el usuario "${user.nombre}" con rol ${user.role}.`,
        actionRoute: '/usuarios',
        metadata: JSON.stringify({ userId: user.id, action: 'created' }),
      });
    },
  });
}
