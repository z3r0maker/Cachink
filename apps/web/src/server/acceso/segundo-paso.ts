import {
  guardAttempt,
  throttleKey,
  TOTP_PER_ACCOUNT,
  useSecondFactor,
  type FactorUsed,
  type SecondFactorDeps,
  type ThrottleSubject,
} from '@xangarro/auth-core';

import { STEP_UP_SECONDS } from './plazos';
import type { AccessDeps, Cuenta } from './ports';

/**
 * The second factor at the door and in the re-ask dialog (N-83, ADR-142;
 * boards SgDesafio and SgReconfirmar). Checking the code is
 * `@xangarro/auth-core`'s `useSecondFactor`, shared with the console; the
 * challenge, the session and the 15-minute proof are the portal's.
 *
 * One throttle subject per account for both places, so five wrong codes lock
 * the account whether they were typed at sign-in or in the dialog.
 */
export const sujetosDelFactor = (userId: string): ThrottleSubject[] => [
  { key: throttleKey('portal', 'totp', userId), policy: TOTP_PER_ACCOUNT, clearOnSuccess: true },
];

export const factorDeps = (deps: AccessDeps): SecondFactorDeps => ({
  repo: deps.factor,
  totpKey: deps.totpKey(),
  now: deps.now,
});

export type Rechazado =
  | { readonly kind: 'failed' }
  | { readonly kind: 'locked'; readonly wait: number };
export type Comprobado = { readonly kind: 'ok'; readonly usado: FactorUsed } | Rechazado;

async function comprobar(deps: AccessDeps, userId: string, input: string): Promise<Comprobado> {
  const result = await guardAttempt(deps.throttle, sujetosDelFactor(userId), () =>
    useSecondFactor(factorDeps(deps), userId, input),
  );
  return result.kind === 'ok' ? { kind: 'ok', usado: result.value } : result;
}

/** The account a sign-in challenge is waiting on; null once spent, expired or made up. */
export async function retoPendiente(
  deps: AccessDeps,
  reto: string | undefined,
): Promise<Cuenta | null> {
  if (reto === undefined) return null;
  const view = await deps.links.peek(reto, 'challenge');
  return view?.state === 'fresh' ? { id: view.userId, email: view.email } : null;
}

export type Verificado =
  | Comprobado
  | { readonly kind: 'sin-reto' }
  | { readonly kind: 'sin-negocio' };

/**
 * Step two of a sign-in: an app code or a recovery code. Only now does a
 * session exist, and it starts with its proof fresh, so the first sensitive
 * change is not asked again.
 */
export async function verificarSegundoPaso(
  deps: AccessDeps,
  reto: string | undefined,
  input: string,
): Promise<Verificado> {
  const c = await retoPendiente(deps, reto);
  if (c === null || reto === undefined) return { kind: 'sin-reto' };
  const result = await comprobar(deps, c.id, input);
  if (result.kind !== 'ok') return result;
  // Spent by another tab between the check and here: that tab has the session.
  if ((await deps.links.consume(reto, 'challenge')) === null) return { kind: 'sin-reto' };
  if (!(await deps.sessions.open(c.id))) return { kind: 'sin-negocio' };
  await deps.sessions.stepUp();
  return result;
}

/** Whether the second factor is on for this account. */
export async function factorActivo(deps: AccessDeps, userId: string): Promise<boolean> {
  return Boolean((await deps.factor.status(userId))?.enrolledAt);
}

/**
 * Whether this session may make a sensitive change now: the second factor is
 * off, or it was proven on this session in the last 15 minutes.
 */
export async function reconfirmado(deps: AccessDeps, userId: string): Promise<boolean> {
  if (!(await factorActivo(deps, userId))) return true;
  return deps.sessions.steppedUp(STEP_UP_SECONDS);
}

/** The re-ask dialog's «Confirmar»: a code renews the session's proof. */
export async function confirmarIdentidad(
  deps: AccessDeps,
  userId: string,
  input: string,
): Promise<Comprobado> {
  const result = await comprobar(deps, userId, input);
  if (result.kind === 'ok') await deps.sessions.stepUp();
  return result;
}
