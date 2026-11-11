import { hashToken as hash, mintToken } from '@xangarro/auth-core';
import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

/**
 * Emailed links (ADR-080): a password reset or a one-tap sign-in. The link is
 * 256 random bits, single-use and short-lived; only its hash is stored, and a
 * new link retires the account's earlier unused ones of the same kind.
 *
 * N-83 (ADR-142) keeps three more things in the same table, minted and hashed
 * the same way: `confirm`, the emailed link that confirms a new address;
 * `pending`, the pass the signup browser holds until then; and `challenge`,
 * a sign-in whose password was right and whose second factor is still owed.
 */
export type LinkKind = 'reset' | 'magic' | 'confirm' | 'pending' | 'challenge';

/**
 * A fresh link for `email`'s account — or `null` when no account has that
 * address. The caller sends the email only on a token and answers the visitor
 * the same way either way.
 */
export async function issueLink(
  db: Db,
  email: string,
  kind: LinkKind,
  ttlSeconds: number,
): Promise<string | null> {
  const token = mintToken();
  const [row] = await db.execute<{ found: boolean }>(
    sql`SELECT xangarro.link_issue(${hash(token)}, ${email}, ${kind}, ${ttlSeconds}::int) AS found`,
  );
  return row?.found === true ? token : null;
}

export interface LinkPeek {
  /** `used` also covers a link retired by a newer one of its kind. */
  readonly state: 'fresh' | 'used' | 'expired';
  readonly userId: string;
  readonly email: string;
  /** The account's display name (O-24); null when it never set one. */
  readonly nombre: string | null;
  /** Whether the account's address is confirmed, as of now. */
  readonly confirmed: boolean;
}

/** What a link is right now, without spending it; `null` when there is no such link. */
export async function peekLink(db: Db, token: string, kind: LinkKind): Promise<LinkPeek | null> {
  const [row] = await db.execute<{
    state: LinkPeek['state'];
    user_id: string;
    email: string;
    nombre: string | null;
    confirmed: boolean;
  }>(sql`SELECT * FROM xangarro.link_peek(${hash(token)}, ${kind})`);
  if (row === undefined) return null;
  return {
    state: row.state,
    userId: row.user_id,
    email: row.email,
    nombre: row.nombre,
    confirmed: row.confirmed,
  };
}

/** Spend a link: the account's id, or `null` if used, expired or unknown. */
export async function consumeLink(
  db: Db,
  token: string,
  kind: Extract<LinkKind, 'magic' | 'challenge'>,
): Promise<string | null> {
  const [row] = await db.execute<{ uid: string | null }>(
    sql`SELECT xangarro.link_consume(${hash(token)}, ${kind}) AS uid`,
  );
  return row?.uid ?? null;
}

/** Spend a sign-in link: the account's id, or `null` if used, expired or unknown. */
export const consumeMagicLink = (db: Db, token: string): Promise<string | null> =>
  consumeLink(db, token, 'magic');

/**
 * Spend a `confirm` link and stamp the address as confirmed. The account's id,
 * or `null` if the link was no good.
 */
export async function confirmEmail(db: Db, token: string): Promise<string | null> {
  const [row] = await db.execute<{ uid: string | null }>(
    sql`SELECT xangarro.email_confirm(${hash(token)}) AS uid`,
  );
  return row?.uid ?? null;
}

/**
 * Spend a reset link and store the new bcrypt hash; every portal session of the
 * account ends. The account's id, or `null` if the link was no good.
 */
export async function resetPassword(
  db: Db,
  token: string,
  passwordHash: string,
): Promise<string | null> {
  const [row] = await db.execute<{ uid: string | null }>(
    sql`SELECT xangarro.password_reset(${hash(token)}, ${passwordHash}) AS uid`,
  );
  return row?.uid ?? null;
}
