import type { ConsentGrant } from '@xangarro/domain';
import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * One row in the consent ledger (N-34, PRIV-REG-01), written through
 * `xangarro.privacy_consent_record` (drizzle/0034) so the app role needs no
 * grant on the table. Returns the row's chain hash. Call it inside the same
 * transaction as the account it proves consent for.
 */
export interface ConsentContext {
  readonly userId: string;
  readonly businessId: string;
  /** SHA-256 of the client IP (ADR-079): never the raw address. `''` when unknown. */
  readonly ipHash: string;
  readonly userAgent: string;
}

export async function recordPrivacyConsent(
  conn: Conn,
  ctx: ConsentContext,
  g: ConsentGrant,
): Promise<string> {
  const rows = await conn.execute<{ privacy_consent_record: string }>(
    sql`SELECT xangarro.privacy_consent_record(
      ${ctx.userId}::uuid, ${ctx.businessId},
      ${g.avisoVersion}, ${g.avisoSha256},
      ${g.surface}, ${g.purpose}, ${g.granted}, ${g.method},
      ${ctx.ipHash}, ${ctx.userAgent})`,
  );
  return rows[0]?.privacy_consent_record ?? '';
}
