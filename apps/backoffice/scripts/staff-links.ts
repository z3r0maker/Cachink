/**
 * The owner role's half of enrolment (ADR-160): minting a link and, for a
 * member who lost every device, retiring their passkeys. The console's role
 * can do neither. `scripts/staff.ts` runs these; the e2e fixtures reuse them,
 * so a test mints a link exactly the way an operator does.
 */
import { hashToken, mintToken } from '@xangarro/auth-core';
import type { Db } from '@xangarro/data-pg';
import { sql } from 'drizzle-orm';

import { ENROL_LINK_SECONDS } from '../src/server/auth/config';

/** Voids the member's unused links and mints a fresh one; returns the raw token. */
export async function mintEnrolmentLink(db: Db, staffId: string): Promise<string> {
  const token = mintToken();
  await db.transaction(async (tx) => {
    await tx.execute(sql`
      UPDATE staff_enrolment_links SET voided_at = now()
       WHERE staff_id = ${staffId} AND used_at IS NULL AND voided_at IS NULL`);
    await tx.execute(sql`
      INSERT INTO staff_enrolment_links (token_hash, staff_id, expires_at)
      VALUES (${hashToken(token)}, ${staffId}, now() + make_interval(secs => ${ENROL_LINK_SECONDS}))`);
  });
  return token;
}

/** Retires every passkey of the member and ends every session they hold. */
export async function resetPasskeys(db: Db, staffId: string): Promise<number> {
  return db.transaction(async (tx) => {
    const retired = await tx.execute(sql`
      UPDATE staff_passkeys SET revoked_at = now()
       WHERE staff_id = ${staffId} AND revoked_at IS NULL
      RETURNING id`);
    await tx.execute(sql`
      UPDATE staff_sessions SET revoked_at = now()
       WHERE staff_id = ${staffId} AND revoked_at IS NULL`);
    return retired.length;
  });
}

/** The live member behind an address, or null. */
export async function liveStaffId(db: Db, email: string): Promise<string | null> {
  const [row] = await db.execute<{ id: string }>(sql`
    SELECT id FROM staff_members WHERE lower(email) = ${email} AND revoked_at IS NULL`);
  return row?.id ?? null;
}
