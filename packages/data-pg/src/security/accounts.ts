import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Sign-up's identity row (P-03) through `xangarro.account_*` (0018): the app
 * role never reads or writes `auth.users` directly, which hosted Supabase
 * would refuse anyway.
 */
export async function accountEmailTaken(db: Conn, email: string): Promise<boolean> {
  const [row] = await db.execute<{ taken: boolean }>(
    sql`SELECT xangarro.account_email_taken(${email}) AS taken`,
  );
  return row?.taken === true;
}

/** False when the address is already taken (including a race lost just now). */
export async function createAccount(
  db: Conn,
  a: {
    readonly id: string;
    readonly email: string;
    readonly passwordHash: string;
    /** The account's display name (O-24); empty means none. */
    readonly nombre: string;
    readonly at: string;
  },
): Promise<boolean> {
  const [row] = await db.execute<{ created: boolean }>(
    sql`SELECT xangarro.account_create(${a.id}::uuid, ${a.email}, ${a.passwordHash}, ${a.nombre}, ${a.at}::timestamptz) AS created`,
  );
  return row?.created === true;
}

/** Whether the account's address is confirmed (N-83); `null` when there is no such account. */
export async function accountConfirmed(db: Conn, userId: string): Promise<boolean | null> {
  const [row] = await db.execute<{ ok: boolean | null }>(
    sql`SELECT xangarro.account_confirmed(${userId}::uuid) AS ok`,
  );
  return row?.ok ?? null;
}

/**
 * An emailed link reached an account nobody had confirmed: the address is
 * confirmed and its sessions end. After a sign-in link the password of whoever
 * registered it goes too; after a reset (`keepPassword`) it is the one just
 * chosen, and stays. False when the account was already confirmed, and then
 * nothing changed.
 */
export async function claimAccount(
  db: Conn,
  userId: string,
  keepPassword: boolean,
): Promise<boolean> {
  const [row] = await db.execute<{ claimed: boolean }>(
    sql`SELECT xangarro.account_claim(${userId}::uuid, ${keepPassword}::boolean) AS claimed`,
  );
  return row?.claimed === true;
}

/**
 * Correct a mistyped address while it is unconfirmed. False when the account
 * is confirmed already or another account has the new address.
 */
export async function changeAccountEmail(
  db: Conn,
  userId: string,
  email: string,
): Promise<boolean> {
  const [row] = await db.execute<{ changed: boolean }>(
    sql`SELECT xangarro.account_change_email(${userId}::uuid, ${email}) AS changed`,
  );
  return row?.changed === true;
}
