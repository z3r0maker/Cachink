/**
 * useQuickSwitchAuth — operator list + PIN sign-in for the QuickSwitchGate.
 *
 * Operators and their PINs come down from the portal (A-05, Q2): the device
 * only authenticates. No create, no change PIN, no recovery. Five wrong PINs
 * for an operator lock that operator's NIP, longer each time in a row
 * (`pin-lockout.ts`, audit F-08): the count is theirs, shared by every path
 * that checks their NIP, and kept in app_config so a restart does not reset
 * it. Other operators keep signing in, and their NIPs do not clear it.
 */

import { useState } from 'react';
import type { BusinessId, User, UserId } from '@xangarro/domain';
import { useQuery } from '@tanstack/react-query';
import { AutenticarUsuarioUseCase } from '@xangarro/application';
import { attemptNip, type NipCheck } from '@xangarro/caja/nip';
import type { AppConfigRepository } from '@xangarro/data';
import { useSetUserId } from '../app-config/use-app-config';
import { useTranslation } from '../i18n/index';
import { deviceNipGuard, nipRefusal } from './pin-lockout';
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
  readonly wrongPin: string;
  readonly setSubmitting: (v: boolean) => void;
  readonly setError: (v: string | null) => void;
  readonly signIn: (userId: UserId) => void;
}

/** What `AutenticarUsuarioUseCase` answers, as the guard reads it. */
async function checkPin(deps: AuthDeps, userId: UserId, pin: string): Promise<NipCheck<UserId>> {
  const user = await deps.usersRepo.findById(userId);
  const result = user
    ? await new AutenticarUsuarioUseCase(deps.usersRepo).execute({
        nombre: user.nombre,
        pin,
        businessId: deps.businessId,
      })
    : null;
  return result?.success && result.userId ? { ok: true, value: result.userId } : { ok: false };
}

/** Verifies a PIN; returns the error message to show, or null on success. */
async function verifyPin(deps: AuthDeps, userId: UserId, pin: string): Promise<string | null> {
  // Counted against the operator picked: it is their NIP that is being tried.
  const attempt = await attemptNip(deviceNipGuard(deps.appConfig), userId, () =>
    checkPin(deps, userId, pin),
  );
  if (attempt.status !== 'ok') return nipRefusal(attempt, deps.wrongPin);
  deps.signIn(attempt.value);
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

export function useQuickSwitchAuth(businessId: BusinessId): QuickSwitchAuthResult {
  const { t } = useTranslation();
  const usersRepo = useUsersRepository();
  const appConfig = useAppConfigRepository();
  const signIn = useSetUserId();
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
    wrongPin: t('entrar.nip.error'),
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
