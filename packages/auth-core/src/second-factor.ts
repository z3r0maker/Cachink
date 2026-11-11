import { AuthCoreError } from './errors.js';
import {
  generateRecoveryCodes,
  hashRecoveryCode,
  looksLikeRecoveryCode,
  type RecoveryCodeSet,
} from './recovery-codes.js';
import { openSecret, sealSecret } from './secret-box.js';
import { generateTotpSecret, otpauthUri, verifyTotp } from './totp.js';

/**
 * The second factor, without the storage, the throttle or the session: what
 * the staff console (N-05) and the owner portal (N-83) both do with a TOTP
 * seed and its recovery codes. Each app wraps these in its own `guardAttempt`
 * subjects, its own audit and its own way of raising a session.
 */
export interface TotpState {
  /** Sealed seed; present while enrolling and once enrolled. */
  readonly secretEnc: string | null;
  readonly enrolledAt: string | null;
  readonly lastStep: number | null;
}

/** Every write is conditional, so two tabs or a replay can never both win. */
export interface SecondFactorRepo<Id extends string = string> {
  /** Null when the account does not exist (or is revoked). */
  totpState(id: Id): Promise<TotpState | null>;
  /**
   * Store a pending seed — only while not enrolled and the stored one is still
   * `previous` (compare-and-swap), so two tabs cannot each show a different QR.
   */
  savePendingSecret(id: Id, previous: string | null, sealed: string): Promise<boolean>;
  /** Mark enrolled with its first step and recovery hashes — only if not yet enrolled. */
  completeEnrolment(id: Id, step: number, recoveryHashes: readonly string[]): Promise<boolean>;
  /** Record `step` as used — only if it is newer than the last one. */
  advanceStep(id: Id, step: number): Promise<boolean>;
  /** Remove one recovery-code hash; the number left, or null if it was not there. */
  consumeRecoveryCode(id: Id, hash: string): Promise<number | null>;
}

export interface SecondFactorDeps<Id extends string = string> {
  readonly repo: SecondFactorRepo<Id>;
  /** 32-byte AES key that seals every seed. */
  readonly totpKey: Uint8Array;
  readonly now: () => Date;
}

/** What an enrolment screen shows: the seed as a QR (`uri`) and as a key to type. */
export interface EnrolmentView {
  readonly secret: string;
  readonly uri: string;
}

function openPending(key: Uint8Array, id: string, sealed: string | null): string | null {
  if (sealed === null) return null;
  try {
    return openSecret(key, sealed, id);
  } catch (error) {
    if (error instanceof AuthCoreError) return null;
    throw error;
  }
}

/**
 * The seed is generated once and stored sealed (pending) until a code confirms
 * it, so reloading the page shows the **same** QR the app may already have
 * scanned. A pending seed that no longer opens (the key was rotated) is simply
 * replaced: nothing depends on it yet. Null when there is nothing to enrol —
 * already enrolled, no such account, or a concurrent enrolment.
 */
export async function prepareTotpEnrolment<Id extends string>(
  deps: SecondFactorDeps<Id>,
  id: Id,
  label: { readonly account: string; readonly issuer: string },
): Promise<EnrolmentView | null> {
  const state = await deps.repo.totpState(id);
  if (state === null || state.enrolledAt !== null) return null;

  let secret = openPending(deps.totpKey, id, state.secretEnc);
  if (secret === null) {
    secret = generateTotpSecret();
    const sealed = sealSecret(deps.totpKey, secret, id);
    if (!(await deps.repo.savePendingSecret(id, state.secretEnc, sealed))) return null;
  }
  return { secret, uri: otpauthUri({ secret, ...label }) };
}

/**
 * The first code proves the app holds the seed. Enrolment is recorded with
 * that code's step, so it cannot be reused, and ten recovery codes are issued:
 * returned here once, stored only hashed. Null for a wrong code or when there
 * is nothing pending.
 */
export async function confirmTotpEnrolment<Id extends string>(
  deps: SecondFactorDeps<Id>,
  id: Id,
  code: string,
): Promise<RecoveryCodeSet | null> {
  const state = await deps.repo.totpState(id);
  if (!state?.secretEnc || state.enrolledAt !== null) return null;
  const step = verifyTotp(openSecret(deps.totpKey, state.secretEnc, id), code, deps.now());
  if (step === null) return null;
  const set = generateRecoveryCodes();
  return (await deps.repo.completeEnrolment(id, step, set.hashes)) ? set : null;
}

export type FactorUsed =
  | { readonly method: 'totp' }
  | { readonly method: 'recovery'; readonly left: number };

async function useTotp<Id extends string>(deps: SecondFactorDeps<Id>, id: Id, code: string) {
  const state = await deps.repo.totpState(id);
  if (!state?.secretEnc || state.enrolledAt === null) return null;
  const secret = openSecret(deps.totpKey, state.secretEnc, id);
  const step = verifyTotp(secret, code, deps.now(), state.lastStep);
  if (step === null) return null;
  return (await deps.repo.advanceStep(id, step)) ? ({ method: 'totp' } as const) : null;
}

/**
 * A current TOTP code, or one unused recovery code, typed into the same field.
 * Null when it is neither — the caller counts that against its throttle.
 */
export async function useSecondFactor<Id extends string>(
  deps: SecondFactorDeps<Id>,
  id: Id,
  input: string,
): Promise<FactorUsed | null> {
  if (!looksLikeRecoveryCode(input)) return useTotp(deps, id, input);
  const hash = hashRecoveryCode(input);
  const left = hash === null ? null : await deps.repo.consumeRecoveryCode(id, hash);
  return left === null ? null : { method: 'recovery', left };
}
