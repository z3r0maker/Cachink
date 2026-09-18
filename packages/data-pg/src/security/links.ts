import { hashToken as hash, mintToken } from '@xangarro/auth-core';
import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

/**
 * Emailed links (ADR-080): a password reset or a one-tap sign-in. The link is
 * 256 random bits, single-use and short-lived; only its hash is stored, and a
 * new link retires the account's earlier unused ones of the same kind.
 */
export type LinkKind = 'reset' | 'magic';

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

/** Spend a sign-in link: the account's id, or `null` if used, expired or unknown. */
export async function consumeMagicLink(db: Db, token: string): Promise<string | null> {
  const [row] = await db.execute<{ uid: string | null }>(
    sql`SELECT xangarro.link_consume(${hash(token)}, 'magic') AS uid`,
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
