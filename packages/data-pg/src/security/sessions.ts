import { hashToken as hash, mintToken } from '@xangarro/auth-core';
import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

/**
 * Server-side portal sessions (audit SEC-AUTH-01).
 *
 * The cookie is 256 random bits and means nothing on its own: the server looks
 * it up every request, so logout, expiry, idleness and a removed membership all
 * end it immediately. Only its hash is stored.
 */
export interface ResolvedSession {
  readonly userId: string;
  readonly email: string;
  /** The account's display name (O-24); null when the account never set one. */
  readonly nombre: string | null;
  readonly businessId: string;
  readonly role: 'owner' | 'admin' | 'viewer';
}

export async function openSession(
  db: Db,
  userId: string,
  businessId: string,
  ttlSeconds: number,
): Promise<string> {
  const token = mintToken();
  await db.execute(
    sql`SELECT xangarro.session_open(${hash(token)}, ${userId}::uuid, ${businessId}, ${ttlSeconds}::int)`,
  );
  return token;
}

export async function resolveSession(
  db: Db,
  token: string,
  idleSeconds: number,
): Promise<ResolvedSession | null> {
  const [row] = await db.execute<{
    user_id: string;
    email: string;
    nombre: string | null;
    business_id: string;
    role: string;
  }>(sql`SELECT * FROM xangarro.session_resolve(${hash(token)}, ${idleSeconds}::int)`);
  if (row === undefined) return null;
  return {
    userId: row.user_id,
    email: row.email,
    nombre: row.nombre,
    businessId: row.business_id,
    role: row.role as ResolvedSession['role'],
  };
}

export async function revokeSession(db: Db, token: string): Promise<void> {
  await db.execute(sql`SELECT xangarro.session_revoke(${hash(token)})`);
}

/** One account's id and bcrypt hash, by email — the app role cannot read hashes otherwise. */
export async function loginLookup(
  db: Db,
  email: string,
): Promise<{ id: string; email: string; hash: string | null } | null> {
  const [row] = await db.execute<{ id: string; email: string; encrypted_password: string | null }>(
    sql`SELECT * FROM xangarro.login_lookup(${email})`,
  );
  return row === undefined ? null : { id: row.id, email: row.email, hash: row.encrypted_password };
}

/**
 * This session just proved the second factor (N-83): at sign-in, at enrolment,
 * or in the re-ask dialog. False when the session is not live.
 */
export async function stepUpSession(db: Db, token: string): Promise<boolean> {
  const [row] = await db.execute<{ ok: boolean }>(
    sql`SELECT xangarro.session_step_up(${hash(token)}) AS ok`,
  );
  return row?.ok === true;
}

/** Whether that proof is younger than `windowSeconds`. */
export async function sessionSteppedUp(
  db: Db,
  token: string,
  windowSeconds: number,
): Promise<boolean> {
  const [row] = await db.execute<{ ok: boolean }>(
    sql`SELECT xangarro.session_stepped_up(${hash(token)}, ${windowSeconds}::int) AS ok`,
  );
  return row?.ok === true;
}

/** The last error a session was shown: the Sentry event that names it, and when it was kept. */
export interface SessionLastError {
  readonly eventId: string;
  /** An ISO instant. */
  readonly at: string;
}

/**
 * Keep the error this session was just shown (P-48, ADR-162 §8), so a report
 * sent from Ayuda can name it. False when the session is not live or the id
 * is not a Sentry event id; the newest error replaces the one before.
 */
export async function noteSessionError(db: Db, token: string, eventId: string): Promise<boolean> {
  const [row] = await db.execute<{ ok: boolean }>(
    sql`SELECT xangarro.session_note_error(${hash(token)}, ${eventId}) AS ok`,
  );
  return row?.ok === true;
}

/** The last error a live session was shown; null when it has seen none. */
export async function sessionLastError(db: Db, token: string): Promise<SessionLastError | null> {
  const [row] = await db.execute<{ event_id: string; at: unknown }>(
    sql`SELECT event_id, at FROM xangarro.session_last_error(${hash(token)})`,
  );
  if (row === undefined) return null;
  // The driver hands a timestamptz back as text or as a Date: parse, never assert.
  return { eventId: row.event_id, at: new Date(row.at as string | Date).toISOString() };
}
