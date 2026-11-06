import { createHash, randomBytes } from 'node:crypto';

import postgres from 'postgres';

import type { Tenant } from './tenant';

/**
 * An account deletion request for a minted tenant, made through the same
 * definer the portal calls, with a token the spec knows: what the
 * confirmation email would carry. Only its SHA-256 is stored, as in
 * production (ADR-136).
 */
export async function pedirEliminacion(t: Tenant): Promise<{ folio: string; token: string }> {
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  try {
    const [row] = await sql<{ folio: string }[]>`
      SELECT folio FROM xangarro.account_delete_request(
        ${t.ownerId}::uuid, ${t.email}, ${hash}, '{}'::text[], 30)`;
    return { folio: row?.folio ?? '', token };
  } finally {
    await sql.end({ timeout: 5 });
  }
}
