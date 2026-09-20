import { randomBytes } from 'node:crypto';
import { hashPassword } from '@xangarro/auth-core';
import postgres from 'postgres';

import { STAFF_EMAIL, STAFF_PASSWORD } from './helpers';

/**
 * The staff fixture, once per run: an allowlisted member with a known
 * password (the same columns the CLI writes; it is not reused because its
 * password comes from stdin and it prints nothing a script can consume).
 * TOTP is deliberately NOT seeded — the suite enrolls through the page, the
 * way a real first sign-in goes. Any row from an earlier run is removed
 * first: the unique key is partial (`lower(email) WHERE revoked_at IS NULL`),
 * so reviving duplicates would collide there.
 */
export default async function globalSetup(): Promise<void> {
  const url = process.env.DATABASE_SUPER_URL ?? process.env.DATABASE_URL ?? '';
  if (url === '') throw new Error('DATABASE_SUPER_URL (or DATABASE_URL) is not set.');
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    const hash = await hashPassword(STAFF_PASSWORD);
    // A previous run's lockout test leaves the account throttled for 15 min;
    // the keys are sha256 of the email, so the reset clears the shared table.
    // This DB is the suite's throwaway — nothing else runs against it.
    await sql`DELETE FROM xangarro.throttle`;
    // One inbox item for the audit test; ignored if a run's assignment left it.
    await sql`
      INSERT INTO support_items (id, kind, status, urgent, owner_staff_id, business_id,
                                 title, body, source, source_ref, created_at, updated_at)
      SELECT '01E2ABCDE00000000000000000', 'bug', 'nuevo', false, NULL, b.id,
             'E2E: botón que no guarda', 'Paso a paso…', 'e2e', 'e2e-1', now(), now()
        FROM businesses b LIMIT 1
      ON CONFLICT (id) DO UPDATE SET status = 'nuevo', owner_staff_id = NULL,
        updated_at = now()`;
    // The audit log references staff rows; the suite's own audit evidence is
    // per-run, so the reset clears this email's history with it.
    await sql`DELETE FROM staff_sessions USING staff_members s
               WHERE staff_sessions.staff_id = s.id AND lower(s.email) = lower(${STAFF_EMAIL})`;
    await sql`DELETE FROM staff_audit_log USING staff_members s
               WHERE staff_audit_log.staff_id = s.id AND lower(s.email) = lower(${STAFF_EMAIL})`;
    await sql`DELETE FROM staff_members WHERE lower(email) = lower(${STAFF_EMAIL})`;
    const id = `01E2STAFF${randomBytes(9).toString('hex').toUpperCase()}`.slice(0, 26);
    await sql`
      INSERT INTO staff_members (id, email, nombre, password_hash, created_at)
      VALUES (${id}, ${STAFF_EMAIL}, 'E2E Staff', ${hash}, now())`;
  } finally {
    await sql.end({ timeout: 5 });
  }
}
