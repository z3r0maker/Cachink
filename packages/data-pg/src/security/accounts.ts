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
