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
