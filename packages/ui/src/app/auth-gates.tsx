/**
 * Auth gates — sub-components of GatedNavigation for user auth flow.
 *
 * Extracted to keep gated-navigation.tsx under 200 lines.
 * These gates handle the post-business, pre-app authentication:
 *   1. DirectorSetupGate — first user account creation
 *   2. QuickSwitchGate — user avatar selection + login
 *   3. ChangePinGate — forced PIN change
 *
 * ADR-049: PIN for login, Password for recovery.
 */

import type { ReactElement } from 'react';
import type { BusinessId, UserRole } from '@cachink/domain';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUsersRepository } from './repository-provider';
import {
  useSetRole,
  useSetUserId,
  useSetUserRole,
  useSetMustChangePin,
} from '../app-config/use-app-config';
import { DirectorSetupScreen, type DirectorSetupSubmitInput } from '../screens/DirectorSetup/index';
import { CrearUsuarioUseCase } from '@cachink/application';
import { USERS_KEY } from './query-keys-auth';

export interface AuthGatesProps {
  readonly businessId: BusinessId;
}

export function useAuthGateState(businessId: BusinessId): {
  hasUsers: boolean | undefined;
  isLoading: boolean;
} {
  const users = useUsersRepository();
  const query = useQuery({
    queryKey: [...USERS_KEY, businessId],
    queryFn: () => users.findAllByBusiness(businessId),
  });
  return {
    hasUsers: query.data !== undefined ? query.data.length > 0 : undefined,
    isLoading: query.isLoading,
  };
}

export function DirectorSetupGate(props: AuthGatesProps): ReactElement {
  const users = useUsersRepository();
  const queryClient = useQueryClient();
  const setUserId = useSetUserId();
  const setUserRole = useSetUserRole();
  const setRole = useSetRole();
  const setMustChangePin = useSetMustChangePin();

  const mutation = useMutation({
    mutationFn: async (input: DirectorSetupSubmitInput) => {
      // Yield one frame so React paints the loading spinner before bcrypt blocks
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const crear = new CrearUsuarioUseCase(users);
      return crear.execute({
        nombre: input.nombre,
        pin: input.pin,
        recoveryPassword: input.recoveryPassword,
        role: 'director',
        mustChangePin: false, // Director chose their own PIN
        businessId: props.businessId,
      });
    },
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: USERS_KEY });
      setUserId(user.id);
      setUserRole(user.role as UserRole);
      setRole(user.role);
      setMustChangePin(false);
    },
  });

  return (
    <DirectorSetupScreen
      onSubmit={(input) => mutation.mutate(input)}
      submitting={mutation.isPending}
    />
  );
}

export { USERS_KEY } from './query-keys-auth';
export { QuickSwitchGate } from './quick-switch-gate';
export { ChangePinGate } from './change-pin-gate';
