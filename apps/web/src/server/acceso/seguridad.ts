import {
  confirmTotpEnrolment,
  generateRecoveryCodes,
  guardAttempt,
  LOGIN_PER_EMAIL,
  prepareTotpEnrolment,
  throttleKey,
} from '@xangarro/auth-core';

import { STEP_UP_SECONDS, TOTP_ISSUER } from './plazos';
import type { AccessDeps, Cuenta } from './ports';
import { factorDeps, sujetosDelFactor, type Rechazado } from './segundo-paso';

/**
 * «Seguridad» (N-83, ADR-142; boards SgSeguridad and SgActivar): turning the
 * second factor on, new recovery codes, turning it off. Optional, per person.
 */
export interface EstadoSeguridad {
  readonly activa: boolean;
  /** ISO-8601; when it was turned on. */
  readonly desde: string | null;
  /** Recovery codes left. */
  readonly codigos: number;
  /** Show the one-time invitation: off, and never answered. */
  readonly invitar: boolean;
}

export async function estadoSeguridad(
  deps: AccessDeps,
  userId: string,
): Promise<EstadoSeguridad | null> {
  const s = await deps.factor.status(userId);
  if (s === null) return null;
  const activa = s.enrolledAt !== null;
  return {
    activa,
    desde: s.enrolledAt,
    codigos: s.codesLeft,
    invitar: !activa && !s.inviteDismissed,
  };
}

export type Preparada =
  | { readonly kind: 'ok'; readonly secret: string; readonly uri: string }
  | { readonly kind: 'password' }
  | { readonly kind: 'locked'; readonly wait: number }
  | { readonly kind: 'ya-activa' };

/**
 * Step 1 and 2 of turning it on: the password, then the seed to scan. The
 * password is asked so an unattended session cannot bind someone else's phone;
 * wrong ones are counted like a sign-in's.
 */
export async function prepararActivacion(
  deps: AccessDeps,
  c: Cuenta,
  password: string,
): Promise<Preparada> {
  const subject = {
    key: throttleKey('portal', 'reauth', c.id),
    policy: LOGIN_PER_EMAIL,
    clearOnSuccess: true,
  };
  const known = await guardAttempt(deps.throttle, [subject], () =>
    deps.accounts.passwordMatches(c.email, password),
  );
  if (known.kind === 'locked') return known;
  if (known.kind === 'failed') return { kind: 'password' };
  const label = { account: c.email, issuer: TOTP_ISSUER };
  const view = await prepareTotpEnrolment(factorDeps(deps), c.id, label);
  return view === null ? { kind: 'ya-activa' } : { kind: 'ok', ...view };
}

export type Activada = { readonly kind: 'ok'; readonly codigos: readonly string[] } | Rechazado;

/** Step 3: the first code turns it on. The recovery codes are returned here, once. */
export async function activar(deps: AccessDeps, userId: string, code: string): Promise<Activada> {
  const result = await guardAttempt(deps.throttle, sujetosDelFactor(userId), () =>
    confirmTotpEnrolment(factorDeps(deps), userId, code),
  );
  if (result.kind !== 'ok') return result;
  await deps.sessions.stepUp();
  return { kind: 'ok', codigos: result.value.codes };
}

type Sensible = 'ok' | 'reconfirmar' | 'inactiva';

/** New codes and turning it off both need it on, and a proof no older than 15 minutes. */
async function puede(deps: AccessDeps, userId: string): Promise<Sensible> {
  if (!(await deps.factor.status(userId))?.enrolledAt) return 'inactiva';
  return (await deps.sessions.steppedUp(STEP_UP_SECONDS)) ? 'ok' : 'reconfirmar';
}

export type CodigosNuevos =
  | { readonly kind: 'ok'; readonly codigos: readonly string[] }
  | { readonly kind: 'reconfirmar' | 'inactiva' };

/** «Generar códigos nuevos»: ten fresh ones, shown once; the earlier ones stop working. */
export async function nuevosCodigos(deps: AccessDeps, userId: string): Promise<CodigosNuevos> {
  const allowed = await puede(deps, userId);
  if (allowed !== 'ok') return { kind: allowed };
  const set = generateRecoveryCodes();
  const replaced = await deps.factor.replaceRecoveryCodes(userId, set.hashes);
  return replaced ? { kind: 'ok', codigos: set.codes } : { kind: 'inactiva' };
}

/** «Desactivar»: back to the password alone. */
export async function desactivar(deps: AccessDeps, userId: string): Promise<Sensible> {
  const allowed = await puede(deps, userId);
  if (allowed !== 'ok') return allowed;
  return (await deps.factor.disable(userId)) ? 'ok' : 'inactiva';
}

/** «Ahora no» on the invitation: it is shown once per person. */
export const descartarInvitacion = (deps: AccessDeps, userId: string): Promise<void> =>
  deps.factor.dismissInvite(userId);
