import {
  finishPasskeyAssertion,
  finishPasskeyRegistration,
  hashToken,
  startPasskeyAssertion,
  startPasskeyRegistration,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from '@xangarro/auth-core';

import { STEP_UP_SECONDS } from './config';
import { passkeyName } from './passkey-names';
import type { AuthDeps, PasskeyView, StaffSession } from './ports';

/**
 * «Mi acceso» (N-85, ADR-160): a member's own passkeys. Adding or removing one
 * needs a tap within the last 5 minutes on this session (signing in counts),
 * so a session left open can neither plant a passkey nor delete one. The last
 * passkey cannot be removed; removing any other ends the sessions it opened.
 */
export interface MyPasskey extends PasskeyView {
  /** This session was opened with it. */
  readonly current: boolean;
}

export type AddStart =
  | { readonly kind: 'ok'; readonly options: PublicKeyCredentialCreationOptionsJSON }
  | { readonly kind: 'stepup' };

export type AddFinish =
  | { readonly kind: 'ok'; readonly nombre: string }
  | { readonly kind: 'stepup' }
  | { readonly kind: 'failed' };

export function isSteppedUp(session: StaffSession, now: Date): boolean {
  return now.getTime() - session.steppedUpAt.getTime() < STEP_UP_SECONDS * 1000;
}

export async function listPasskeys(
  deps: AuthDeps,
  session: StaffSession,
): Promise<readonly MyPasskey[]> {
  const list = await deps.passkeys.listFor(session.staffId);
  return list.map((p) => ({ ...p, current: p.id === session.passkeyId }));
}

const stepUpPurpose = (s: StaffSession) => `stepup:${s.staffId}`;
const addPurpose = (s: StaffSession) => `register:${s.staffId}`;

/** The re-ask: only this member's passkeys may answer it. */
export async function startStepUp(
  deps: AuthDeps,
  session: StaffSession,
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const allow = (await deps.passkeys.listFor(session.staffId)).map((p) => ({ id: p.id }));
  return startPasskeyAssertion(deps, stepUpPurpose(session), allow);
}

export async function finishStepUp(
  deps: AuthDeps,
  session: StaffSession,
  token: string,
  response: AuthenticationResponseJSON,
): Promise<boolean> {
  const result = await finishPasskeyAssertion(deps, stepUpPurpose(session), response);
  if (!result.ok || result.ownerId !== session.staffId) return false;
  await deps.sessions.stepUp(hashToken(token));
  await deps.audit(session.staffId, 'auth.reconfirmar_llave', { llave: result.credentialId });
  return true;
}

export async function startAddPasskey(deps: AuthDeps, session: StaffSession): Promise<AddStart> {
  if (!isSteppedUp(session, deps.now())) return { kind: 'stepup' };
  const existing = (await deps.passkeys.listFor(session.staffId)).map((p) => p.id);
  const user = { id: session.staffId, name: session.email, displayName: session.nombre };
  return {
    kind: 'ok',
    options: await startPasskeyRegistration(deps, addPurpose(session), user, existing),
  };
}

export async function finishAddPasskey(
  deps: AuthDeps,
  session: StaffSession,
  response: RegistrationResponseJSON,
): Promise<AddFinish> {
  if (!isSteppedUp(session, deps.now())) return { kind: 'stepup' };
  const result = await finishPasskeyRegistration(deps, addPurpose(session), response);
  if (!result.ok) return { kind: 'failed' };
  const nombre = passkeyName(result.passkey.aaguid, result.passkey.backedUp);
  if (!(await deps.passkeys.add(session.staffId, result.passkey, nombre)))
    return { kind: 'failed' };
  await deps.audit(session.staffId, 'auth.registrar_llave', {
    origen: 'mi_acceso',
    llave: result.passkey.id,
    nombre,
  });
  return { kind: 'ok', nombre };
}

export async function removePasskey(
  deps: AuthDeps,
  session: StaffSession,
  passkeyId: string,
): Promise<'removed' | 'stepup' | 'last' | 'missing'> {
  if (!isSteppedUp(session, deps.now())) return 'stepup';
  const outcome = await deps.passkeys.remove(session.staffId, passkeyId);
  if (outcome === 'removed')
    await deps.audit(session.staffId, 'auth.quitar_llave', { llave: passkeyId });
  return outcome;
}
