/**
 * UsuariosContent — shared user-management UI used by both mobile
 * and desktop route adapters.
 *
 * Renders UserListScreen and CreateUserModal, wires mutations.
 * Route files become thin wrappers.
 *
 * Extracted per CLAUDE.md §6 (40-line budget).
 */

import { useState, type ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BusinessId, User } from '@cachink/domain';
import { UserListScreen } from './user-list-screen';
import { CreateUserModal } from './create-user-modal';
import { useCrearUsuario } from '../../hooks/use-crear-usuario';
import { useEliminarUsuario } from '../../hooks/use-eliminar-usuario';
import { useUsersRepository } from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/use-app-config';
import { userKeys } from '../../hooks/query-keys';

export interface UsuariosContentProps {
  /** Callback to confirm user deletion — platform-specific. */
  readonly onConfirmDelete: (user: User, onConfirmed: () => void) => void;
  readonly testID?: string;
}

function useUsuariosData() {
  const businessId = useCurrentBusinessId();
  const usersRepo = useUsersRepository();
  const crear = useCrearUsuario();
  const eliminar = useEliminarUsuario();
  const usersQ = useQuery({
    queryKey: userKeys.byBusiness(businessId as BusinessId | null),
    queryFn: () => usersRepo.findAllByBusiness(businessId as BusinessId),
    enabled: businessId !== null,
  });
  return { businessId, crear, eliminar, users: usersQ.data ?? [] };
}

export function UsuariosContent(props: UsuariosContentProps): ReactElement {
  const { crear, eliminar, users } = useUsuariosData();
  const [showCreate, setShowCreate] = useState(false);

  if (showCreate) {
    return (
      <CreateUserModal
        onSubmit={(input) => {
          crear.mutate(
            {
              nombre: input.nombre,
              role: input.role,
              pin: input.pin,
              recoveryPassword: input.recoveryPassword,
            },
            { onSuccess: () => setShowCreate(false) },
          );
        }}
        onCancel={() => setShowCreate(false)}
        submitting={crear.isPending}
        testID={`${props.testID ?? 'usuarios'}-create-modal`}
      />
    );
  }

  return (
    <UserListScreen
      users={users}
      onCreateUser={() => setShowCreate(true)}
      onEditUser={() => {
        /* Edit flow wired in a future phase */
      }}
      onDeleteUser={(user) => props.onConfirmDelete(user, () => eliminar.mutate(user.id))}
      testID={props.testID ?? 'usuarios-route'}
    />
  );
}
