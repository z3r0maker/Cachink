import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';

import type {
  AssertionResult,
  PasskeyDeps,
  PasskeyRef,
  RegistrationResult,
  RelyingParty,
  StoredPasskey,
} from './passkey-types.js';
import { hashToken } from './token.js';

/**
 * Passkeys (WebAuthn, ADR-160), without the storage or the session: the two
 * ceremonies, checked by `@simplewebauthn/server`. Every challenge is
 * single-use, tied to a purpose (`login`, `register:<id>`, `stepup:<id>`) and
 * kept server-side only as its hash; every passkey must be discoverable and
 * user-verified, so one tap proves both possession and the person.
 *
 * Wrong or replayed responses never throw: they come back as a refusal with a
 * reason, for the caller's throttle and audit.
 */

export type * from './passkey-types.js';

export const CHALLENGE_TTL_SECONDS = 5 * 60;
const TIMEOUT_MS = 60_000;

/** `user.id` for a passkey: the account id's UTF-8 bytes, base64url. */
export function passkeyUserHandle(ownerId: string): string {
  return Buffer.from(ownerId, 'utf8').toString('base64url');
}

/** The challenge a response answers, or null when its client data is not ours to read. */
function answeredChallenge(clientDataJSON: string): string | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(clientDataJSON, 'base64url').toString('utf8'));
    const challenge = (parsed as { challenge?: unknown }).challenge;
    return typeof challenge === 'string' && challenge !== '' ? challenge : null;
  } catch {
    return null;
  }
}

async function takeChallenge(deps: PasskeyDeps<string>, clientDataJSON: string, purpose: string) {
  const challenge = answeredChallenge(clientDataJSON);
  if (challenge === null) return { challenge: null, taken: false };
  return { challenge, taken: await deps.challenges.take(hashToken(challenge), purpose) };
}

const refs = (list: readonly PasskeyRef[]) =>
  list.map((p) => ({ id: p.id, ...(p.transports ? { transports: [...p.transports] } : {}) }));

export async function startPasskeyRegistration(
  deps: PasskeyDeps<string>,
  purpose: string,
  user: { readonly id: string; readonly name: string; readonly displayName: string },
  exclude: readonly string[],
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const options = await generateRegistrationOptions({
    rpName: deps.rp.name,
    rpID: deps.rp.id,
    userName: user.name,
    userDisplayName: user.displayName,
    userID: Buffer.from(user.id, 'utf8'),
    timeout: TIMEOUT_MS,
    attestationType: 'none',
    excludeCredentials: exclude.map((id) => ({ id })),
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
  });
  await deps.challenges.save(hashToken(options.challenge), purpose, CHALLENGE_TTL_SECONDS);
  return options;
}

export async function finishPasskeyRegistration(
  deps: PasskeyDeps<string>,
  purpose: string,
  response: RegistrationResponseJSON,
): Promise<RegistrationResult> {
  const { challenge, taken } = await takeChallenge(deps, response.response.clientDataJSON, purpose);
  if (challenge === null) return { ok: false, reason: 'invalid' };
  if (!taken) return { ok: false, reason: 'challenge' };
  try {
    const v = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: deps.rp.origin,
      expectedRPID: deps.rp.id,
      requireUserVerification: true,
    });
    if (!v.verified) return { ok: false, reason: 'invalid' };
    const { credential, aaguid, credentialBackedUp } = v.registrationInfo;
    const transports = credential.transports ?? [];
    return {
      ok: true,
      passkey: {
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports,
        aaguid,
        backedUp: credentialBackedUp,
      },
    };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

export async function startPasskeyAssertion(
  deps: PasskeyDeps<string>,
  purpose: string,
  allow: readonly PasskeyRef[] = [],
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const options = await generateAuthenticationOptions({
    rpID: deps.rp.id,
    timeout: TIMEOUT_MS,
    userVerification: 'required',
    ...(allow.length > 0 ? { allowCredentials: refs(allow) } : {}),
  });
  await deps.challenges.save(hashToken(options.challenge), purpose, CHALLENGE_TTL_SECONDS);
  return options;
}

/** The signature counter an assertion reports (bytes 33–36 of the authenticator data). */
function reportedCounter(authenticatorData: string): number | null {
  const bytes = Buffer.from(authenticatorData, 'base64url');
  return bytes.length >= 37 ? bytes.readUInt32BE(33) : null;
}

/** Zero twice is a synced passkey; anything else must move forward. */
const counterMovedOn = (stored: number, next: number) =>
  (stored === 0 && next === 0) || next > stored;

export async function finishPasskeyAssertion<Id extends string>(
  deps: PasskeyDeps<Id>,
  purpose: string,
  response: AuthenticationResponseJSON,
): Promise<AssertionResult<Id>> {
  const { challenge, taken } = await takeChallenge(deps, response.response.clientDataJSON, purpose);
  if (challenge === null) return { ok: false, reason: 'invalid' };
  if (!taken) return { ok: false, reason: 'challenge' };
  const stored = await deps.passkeys.find(response.id);
  if (stored === null) return { ok: false, reason: 'unknown' };
  const handle = response.response.userHandle;
  if (handle !== undefined && handle !== passkeyUserHandle(stored.ownerId))
    return { ok: false, reason: 'invalid' };
  const counter = reportedCounter(response.response.authenticatorData);
  if (counter === null) return { ok: false, reason: 'invalid' };
  if (!counterMovedOn(stored.counter, counter)) {
    return { ok: false, reason: 'counter', ownerId: stored.ownerId, credentialId: stored.id };
  }
  const verified = await verifyAssertion(deps.rp, response, challenge, stored);
  if (!verified || !(await deps.passkeys.recordUse(stored.id, counter)))
    return { ok: false, reason: 'invalid' };
  return { ok: true, ownerId: stored.ownerId, credentialId: stored.id };
}

async function verifyAssertion(
  rp: RelyingParty,
  response: AuthenticationResponseJSON,
  challenge: string,
  stored: StoredPasskey<string>,
): Promise<boolean> {
  try {
    const v = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.id,
      requireUserVerification: true,
      credential: {
        id: stored.id,
        publicKey: new Uint8Array(stored.publicKey),
        counter: stored.counter,
        transports: [...stored.transports],
      },
    });
    return v.verified;
  } catch {
    return false;
  }
}
