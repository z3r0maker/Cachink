/**
 * `useCrearUsuario` — TanStack mutation wrapping `CrearUsuarioUseCase`.
 * Invalidates `['users', businessId]` so the QuickSwitch user list
 * and UserManagement screen update.
 *
 * Issue 6 fix — Second Audit.
 * ADR-049: PIN for login, Password for recovery.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { CrearUsuarioUseCase } from '@cachink/application';
import type { BusinessId, User, UserRole } from '@cachink/domain';
import { useUsersRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { userKeys } from './query-keys';

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

  return useMutation<User, Error, CrearUsuarioHookInput>({
    async mutationFn(input) {
      if (!businessId) {
        throw new Error('useCrearUsuario: no current business set');
      }
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
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: userKeys.byBusiness(businessId as BusinessId),
      });
    },
  });
}
