/**
 * useQuickSwitchAuth — authentication logic for the QuickSwitchGate.
 *
 * Manages user lookup, PIN authentication, and recovery state.
 * Extracted from QuickSwitchGate per CLAUDE.md §6 (40-line budget).
 *
 * ADR-049: PIN for daily login, Password for recovery.
 */

import { useState } from 'react';
import type { BusinessId, User, UserId, UserRole } from '@cachink/domain';
import { useQuery } from '@tanstack/react-query';
import { useUsersRepository } from './repository-provider';
import type { Role } from '../app-config/types';
import {
  useSetRole,
  useSetUserId,
  useSetUserRole,
  useSetMustChangePin,
} from '../app-config/use-app-config';
import { AutenticarUsuarioUseCase, RecuperarPinUseCase } from '@cachink/application';
import { USERS_KEY } from './query-keys-auth';

/** Mask an email: "a***@g***.com" */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const localMask = local.charAt(0) + '***';
  const [domainName, ...ext] = domain.split('.');
  const domainMask = (domainName?.charAt(0) ?? '') + '***';
  return `${localMask}@${domainMask}.${ext.join('.')}`;
}

export interface QuickSwitchAuthResult {
  readonly users: readonly User[];
  readonly error: string | null;
  readonly submitting: boolean;
  readonly recoveryUserId: UserId | null;
  readonly maskedRecoveryEmail: string | null;
  readonly handleAuth: (userId: UserId, pin: string) => void;
  readonly handleRecover: (recoveryPassword: string, newPin: string) => void;
  readonly startRecovery: (userId: UserId) => void;
  readonly cancelRecovery: () => void;
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

async function runRecover(
  recoveryUserId: UserId,
  recoveryPassword: string,
  newPin: string,
  usersRepo: UsersRepo,
  setters: Pick<SettersBundle, 'setSubmitting' | 'setError'>,
  clearRecovery: () => void,
): Promise<void> {
  setters.setSubmitting(true);
  setters.setError(null);
  // Yield one frame so React paints the loading spinner before bcrypt blocks
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  try {
    await new RecuperarPinUseCase(usersRepo).execute({
      userId: recoveryUserId,
      recoveryPassword,
      newPin,
    });
    clearRecovery();
  } catch (e) {
    setters.setError(e instanceof Error ? e.message : 'Error de recuperación');
  } finally {
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
  const [recoveryUserId, setRecoveryUserId] = useState<UserId | null>(null);
  const query = useQuery({
    queryKey: [...USERS_KEY, businessId],
    queryFn: () => usersRepo.findAllByBusiness(businessId),
  });
  const setters = { setSubmitting, setError, setUserId, setUserRole, setRole, setMustChangePin };
  const recUser = query.data?.find((u) => u.id === recoveryUserId);
  const maskedRecoveryEmail = recUser?.email ? maskEmail(recUser.email) : null;
  const handleAuth = (uid: UserId, pin: string) =>
    void runAuth(uid, pin, businessId, usersRepo, setters);
  const handleRecover = (pw: string, pin: string) =>
    recoveryUserId
      ? void runRecover(recoveryUserId, pw, pin, usersRepo, setters, () => setRecoveryUserId(null))
      : undefined;
  const startRecovery = (uid: UserId) => {
    setRecoveryUserId(uid);
    setError(null);
  };
  const cancelRecovery = () => {
    setRecoveryUserId(null);
    setError(null);
  };
  const fixed = { users: query.data ?? [], error, submitting, recoveryUserId, maskedRecoveryEmail };
  return { ...fixed, handleAuth, handleRecover, startRecovery, cancelRecovery };
}
