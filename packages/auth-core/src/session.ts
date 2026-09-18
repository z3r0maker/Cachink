import { AuthCoreError } from './errors.js';
import { hashToken, isPlausibleToken, mintToken } from './token.js';

/**
 * Server-side sessions (ADR-079), without the storage.
 *
 * The store only ever sees `hashToken(token)`; the raw token goes to the
 * cookie and nowhere else. `resolve` is where each app re-checks the grant
 * behind the session (the portal: current membership; the admin console: a
 * live, allowlisted staff row) so revoking access ends the session at once.
 */
export interface SessionStore<Subject, Resolved> {
  open(tokenHash: string, subject: Subject, ttlSeconds: number): Promise<void>;
  /** The live session, touching its last-seen time — or null if revoked, expired or idle. */
  resolve(tokenHash: string, idleSeconds: number): Promise<Resolved | null>;
  revoke(tokenHash: string): Promise<void>;
}

function assertSeconds(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new AuthCoreError('INVALID_ARGUMENT', `${name} must be a positive whole number.`);
  }
}

/** Mint a token, store its hash, and return the token for the cookie. */
export async function issueSession<S, R>(
  store: SessionStore<S, R>,
  subject: S,
  ttlSeconds: number,
): Promise<string> {
  assertSeconds('ttlSeconds', ttlSeconds);
  const token = mintToken();
  await store.open(hashToken(token), subject, ttlSeconds);
  return token;
}

/** The session behind a cookie value. Junk and missing values never reach the store. */
export async function lookupSession<S, R>(
  store: SessionStore<S, R>,
  token: string | null | undefined,
  idleSeconds: number,
): Promise<R | null> {
  assertSeconds('idleSeconds', idleSeconds);
  if (!isPlausibleToken(token)) return null;
  return store.resolve(hashToken(token), idleSeconds);
}

/** Revoke the session behind a cookie value; a junk or missing value is a no-op. */
export async function endSession<S, R>(
  store: SessionStore<S, R>,
  token: string | null | undefined,
): Promise<void> {
  if (!isPlausibleToken(token)) return;
  await store.revoke(hashToken(token));
}
