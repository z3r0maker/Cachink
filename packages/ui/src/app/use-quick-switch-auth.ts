/**
 * useQuickSwitchAuth — operator list + PIN sign-in for the QuickSwitchGate.
 *
 * Operators and their PINs come down from the portal (A-05, Q2): the device
 * only authenticates. No create, no change PIN, no recovery. Five wrong PINs
 * lock PIN entry for 30 s (`pin-lockout.ts`), persisted in app_config so a
 * restart does not reset the counter.
 */

import { useState } from 'react';
import type { BusinessId, User, UserId, UserRole } from '@xangarro/domain';
import { useQuery } from '@tanstack/react-query';
import { AutenticarUsuarioUseCase } from '@xangarro/application';
import type { AppConfigRepository } from '@xangarro/data';
import { APP_CONFIG_KEYS } from '../app-config/index';
import type { Role } from '../app-config/types';
import {
  useSetMustChangePin,
  useSetRole,
  useSetUserId,
  useSetUserRole,
} from '../app-config/use-app-config';
import { useTranslation } from '../i18n/index';
import { NO_LOCKOUT, parsePinLockout, recordPinFailure, remainingLockMs } from './pin-lockout';
import { USERS_KEY } from './query-keys-auth';
import { useAppConfigRepository, useUsersRepository } from './repository-provider';

export interface QuickSwitchAuthResult {
  readonly users: readonly User[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly submitting: boolean;
  readonly handleAuth: (userId: UserId, pin: string) => void;
}

type UsersRepo = ReturnType<typeof useUsersRepository>;

interface AuthDeps {
  readonly usersRepo: UsersRepo;
  readonly appConfig: AppConfigRepository;
  readonly businessId: BusinessId;
  readonly messages: { readonly wrongPin: string; readonly lockedOut: (s: number) => string };
  readonly setSubmitting: (v: boolean) => void;
  readonly setError: (v: string | null) => void;
  readonly signIn: (userId: UserId, role: UserRole | null) => void;
}

/** Verifies a PIN; returns the error message to show, or null on success. */
async function verifyPin(deps: AuthDeps, userId: UserId, pin: string): Promise<string | null> {
  const now = new Date();
  const lockout = parsePinLockout(await deps.appConfig.get(APP_CONFIG_KEYS.pinLockout));
  const lockedMs = remainingLockMs(lockout, now);
  if (lockedMs > 0) return deps.messages.lockedOut(Math.ceil(lockedMs / 1000));
  const user = await deps.usersRepo.findById(userId);
  const result = user
    ? await new AutenticarUsuarioUseCase(deps.usersRepo).execute({
        nombre: user.nombre,
        pin,
        businessId: deps.businessId,
      })
    : null;
  if (!result?.success || !result.userId) {
    const next = recordPinFailure(lockout, now);
    await deps.appConfig.set(APP_CONFIG_KEYS.pinLockout, JSON.stringify(next));
    const nowLocked = remainingLockMs(next, now);
    return nowLocked > 0 ? deps.messages.lockedOut(nowLocked / 1000) : deps.messages.wrongPin;
  }
  await deps.appConfig.set(APP_CONFIG_KEYS.pinLockout, JSON.stringify(NO_LOCKOUT));
  deps.signIn(result.userId, result.role);
  return null;
}

async function runAuth(deps: AuthDeps, userId: UserId, pin: string): Promise<void> {
  deps.setSubmitting(true);
  deps.setError(null);
  // Yield one frame so React paints the loading spinner before bcrypt blocks
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  try {
    const error = await verifyPin(deps, userId, pin);
    // On success leave submitting=true — the gate unmounts when userId propagates.
    if (error !== null) {
      deps.setError(error);
      deps.setSubmitting(false);
    }
  } catch {
    deps.setSubmitting(false);
  }
}

function useSignIn(): (userId: UserId, role: UserRole | null) => void {
  const setUserId = useSetUserId();
  const setUserRole = useSetUserRole();
  const setRole = useSetRole();
  const setMustChangePin = useSetMustChangePin();
  return (userId, role) => {
    setUserId(userId);
    setUserRole(role);
    setRole(role as Role | null);
    setMustChangePin(false);
  };
}

export function useQuickSwitchAuth(businessId: BusinessId): QuickSwitchAuthResult {
  const { t } = useTranslation();
  const usersRepo = useUsersRepository();
  const appConfig = useAppConfigRepository();
  const signIn = useSignIn();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const query = useQuery({
    queryKey: [...USERS_KEY, businessId],
    queryFn: () => usersRepo.findAllByBusiness(businessId),
  });
  const deps: AuthDeps = {
    usersRepo,
    appConfig,
    businessId,
    messages: {
      wrongPin: t('login.error'),
      lockedOut: (seconds) => t('login.lockedOut', { seconds }),
    },
    setSubmitting,
    setError,
    signIn,
  };
  return {
    users: (query.data ?? []).filter((u) => u.active),
    loading: query.isLoading,
    error,
    submitting,
    handleAuth: (uid, pin) => void runAuth(deps, uid, pin),
  };
}
