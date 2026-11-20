import {
  finishPasskeyRegistration,
  hashToken,
  isPlausibleToken,
  startPasskeyRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type RegistrationResponseJSON,
} from '@xangarro/auth-core';

import { passkeyName } from './passkey-names';
import type { AuthDeps, LinkRecord } from './ports';

/**
 * The page a printed enrolment link opens (N-85, ADR-160). The link is minted
 * by the owner-role CLI and names one staff member; registering a passkey
 * spends it. Its challenge is bound to the link (`enlace:<hash>`), so a
 * response cannot be carried from one link to another. Nothing here ever
 * says who a dead link was for.
 */
export type LinkView =
  | { readonly state: 'valido'; readonly nombre: string; readonly expiresAt: Date }
  | { readonly state: 'vencido' | 'usado' | 'invalido' };

type DeadLink = Exclude<LinkView, { state: 'valido' }>;

export type LinkStart =
  | { readonly kind: 'ok'; readonly options: PublicKeyCredentialCreationOptionsJSON }
  | { readonly kind: 'refused'; readonly view: DeadLink };

export type LinkFinish =
  | { readonly kind: 'ok'; readonly nombre: string }
  | { readonly kind: 'failed'; readonly reason: 'challenge' | 'invalid' | 'link' };

function stateOf(record: LinkRecord | null, now: Date): LinkView {
  if (record === null || record.dead) return { state: 'invalido' };
  if (record.usedAt !== null) return { state: 'usado' };
  if (record.expiresAt <= now) return { state: 'vencido' };
  return { state: 'valido', nombre: record.nombre, expiresAt: record.expiresAt };
}

async function lookup(deps: AuthDeps, token: string) {
  if (!isPlausibleToken(token))
    return { hash: null, record: null, view: { state: 'invalido' } as const };
  const hash = hashToken(token);
  const record = await deps.links.find(hash);
  return { hash, record, view: stateOf(record, deps.now()) };
}

const purposeOf = (hash: string) => `enlace:${hash}`;

export async function viewLink(deps: AuthDeps, token: string): Promise<LinkView> {
  return (await lookup(deps, token)).view;
}

export async function startLinkRegistration(deps: AuthDeps, token: string): Promise<LinkStart> {
  const { hash, record, view } = await lookup(deps, token);
  if (view.state !== 'valido' || hash === null || record === null) {
    return { kind: 'refused', view: view as DeadLink };
  }
  const existing = (await deps.passkeys.listFor(record.staffId)).map((p) => p.id);
  const user = { id: record.staffId, name: record.email, displayName: record.nombre };
  const options = await startPasskeyRegistration(deps, purposeOf(hash), user, existing);
  return { kind: 'ok', options };
}

export async function finishLinkRegistration(
  deps: AuthDeps,
  token: string,
  response: RegistrationResponseJSON,
): Promise<LinkFinish> {
  const { hash, view } = await lookup(deps, token);
  if (view.state !== 'valido' || hash === null) return { kind: 'failed', reason: 'link' };
  const result = await finishPasskeyRegistration(deps, purposeOf(hash), response);
  if (!result.ok) return { kind: 'failed', reason: result.reason };
  const nombre = passkeyName(result.passkey.aaguid, result.passkey.backedUp);
  const staffId = await deps.links.spend(hash, result.passkey, nombre);
  if (staffId === null) return { kind: 'failed', reason: 'link' };
  await deps.audit(staffId, 'auth.registrar_llave', {
    origen: 'enlace',
    llave: result.passkey.id,
    nombre,
  });
  return { kind: 'ok', nombre };
}
