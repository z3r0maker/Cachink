/**
 * The logo behind `businesses.logo_url` (0023). `upsertLogo` runs inside the
 * tenant transaction (RLS: only your own row). `logoPublico` is for the
 * public serving route: it goes through `xangarro.logo_publico()` on
 * purpose — a logo prints on receipts, so it is public, and the function
 * answers with the two columns the route needs and nothing else.
 */

import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export interface LogoBytes {
  readonly mime: string;
  readonly bytes: Buffer;
}

/** True when the row was written (it always is; kept boolean for symmetry). */
export async function upsertLogo(
  db: Conn,
  input: { readonly businessId: string; readonly mime: string; readonly bytes: Buffer },
): Promise<boolean> {
  await db.execute(
    sql`
      INSERT INTO business_logos (business_id, mime, bytes, updated_at)
      VALUES (${input.businessId}, ${input.mime}, ${input.bytes}, now())
      ON CONFLICT (business_id)
      DO UPDATE SET mime = excluded.mime, bytes = excluded.bytes, updated_at = now()
    `,
  );
  return true;
}

/** The logo's bytes for the public route; null when the business has none. */
export async function logoPublico(db: Conn, businessId: string): Promise<LogoBytes | null> {
  const rows = await db.execute<{ mime: string; bytes: Buffer }>(
    sql`SELECT mime, bytes FROM xangarro.logo_publico(${businessId})`,
  );
  const row = rows[0];
  return row === undefined ? null : { mime: row.mime, bytes: Buffer.from(row.bytes) };
}
