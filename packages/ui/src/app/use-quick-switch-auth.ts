/**
 * useQuickSwitchAuth — authentication logic for the QuickSwitchGate.
 *
 * Manages user lookup and NIP authentication. A forgotten NIP is reset
 * by the owner from the portal (ADR-072) — no recovery state here.
 */

import { useState } from 'react';
import type { BusinessId, User, UserId, UserRole } from '@xangarro/domain';
import { useQuery } from '@tanstack/react-query';
import { useUsersRepository } from './repository-provider';
import type { Role } from '../app-config/types';
import {
  useSetRole,
  useSetUserId,
  useSetUserRole,
  useSetMustChangePin,
} from '../app-config/use-app-config';
import { AutenticarUsuarioUseCase } from '@xangarro/application';
import { USERS_KEY } from './query-keys-auth';

export interface QuickSwitchAuthResult {
  readonly users: readonly User[];
  readonly error: string | null;
  readonly submitting: boolean;
  readonly handleAuth: (userId: UserId, pin: string) => void;
}

type SetState<T> = (v: T) => void;
type UsersRepo = ReturnType<typeof useUsersRepository>;
type SettersBundle = {
  setSubmitting: SetState<boolean>;
  setError: SetState<string | null>;
  setUserId: SetState<UserId | null>;
  setUserRole: SetState<UserRole | null>;
  setRole: SetState<Role | null>;
  setMustChangePin: SetState<boolean>;
};

async function runAuth(
  userId: UserId,
  pin: string,
  businessId: BusinessId,
  usersRepo: UsersRepo,
  setters: SettersBundle,
): Promise<void> {
  setters.setSubmitting(true);
  setters.setError(null);
  // Yield one frame so React paints the loading spinner before bcrypt blocks
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  try {
    const user = await usersRepo.findById(userId);
    if (!user) {
      setters.setSubmitting(false);
      setters.setError('Usuario no encontrado');
      return;
    }
    const result = await new AutenticarUsuarioUseCase(usersRepo).execute({
      nombre: user.nombre,
      pin,
      businessId,
    });
    if (!result.success) {
      setters.setSubmitting(false);
      setters.setError('PIN incorrecto');
      return;
    }
    // On success: leave submitting=true — the QuickSwitchGate will
    // unmount when userId propagates, taking the spinner with it.
    setters.setUserId(result.userId);
    setters.setUserRole(result.role);
    setters.setRole(result.role);
    setters.setMustChangePin(result.mustChangePin);
  } catch {
    setters.setSubmitting(false);
  }
}

export function useQuickSwitchAuth(businessId: BusinessId): QuickSwitchAuthResult {
  const usersRepo = useUsersRepository();
  const setUserId = useSetUserId();
  const setUserRole = useSetUserRole();
  const setRole = useSetRole();
  const setMustChangePin = useSetMustChangePin();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const query = useQuery({
    queryKey: [...USERS_KEY, businessId],
    queryFn: () => usersRepo.findAllByBusiness(businessId),
  });
  const setters = { setSubmitting, setError, setUserId, setUserRole, setRole, setMustChangePin };
  const handleAuth = (uid: UserId, pin: string) =>
    void runAuth(uid, pin, businessId, usersRepo, setters);
  return { users: query.data ?? [], error, submitting, handleAuth };
}
