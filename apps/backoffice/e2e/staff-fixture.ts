import { randomBytes } from 'node:crypto';
import postgres from 'postgres';

import { STAFF_EMAIL } from './helpers';
import { seedPasskey } from './passkeys';

/**
 * The auth suite's staff member, once per attempt: an allowlisted member and
 * the inbox item the audit test assigns. `withPasskey` seeds the passkey the
 * other tests sign in with; the link test starts without one and registers it
 * through the page, the way a first sign-in goes (ADR-160). Any row from an
 * earlier run is removed first: the unique key is partial
 * (`lower(email) WHERE revoked_at IS NULL`), so reviving duplicates would
 * collide there.
 */
/** The member the link test enrols from nothing, through the page. */
export const ENLACE_EMAIL = 'e2e-enlace@xangarro.mx';

export async function dropStaff(sql: postgres.Sql, email: string): Promise<void> {
  const member = sql`SELECT id FROM staff_members WHERE lower(email) = lower(${email})`;
  await sql`DELETE FROM staff_sessions WHERE staff_id IN (${member})`;
  await sql`DELETE FROM staff_audit_log WHERE staff_id IN (${member})`;
  await sql`DELETE FROM staff_enrolment_links WHERE staff_id IN (${member})`;
  await sql`DELETE FROM staff_passkeys WHERE staff_id IN (${member})`;
  await sql`DELETE FROM staff_members WHERE lower(email) = lower(${email})`;
}

/** A fresh member (and optionally their passkey); returns their id. */
export async function insertStaff(
  sql: postgres.Sql,
  email: string,
  nombre: string,
  prefix: string,
  withPasskey: boolean,
): Promise<string> {
  await dropStaff(sql, email);
  // A ULID-shaped id (Crockford: no I, L, O or U), or the audit log refuses it.
  const id = `${prefix}${randomBytes(12).toString('hex').toUpperCase()}`.slice(0, 26);
  await sql`INSERT INTO staff_members (id, email, nombre, created_at) VALUES (${id}, ${email}, ${nombre}, now())`;
  if (withPasskey) await seedPasskey(sql, id, email);
  return id;
}

export async function resetStaffFixture(): Promise<void> {
  const url = process.env.DATABASE_SUPER_URL ?? process.env.DATABASE_URL ?? '';
  if (url === '') throw new Error('DATABASE_SUPER_URL (or DATABASE_URL) is not set.');
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    // A previous run's lockout test leaves its address throttled for 15 min;
    // this DB is the suite's throwaway, so the reset clears the shared table.
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
    await insertStaff(sql, STAFF_EMAIL, 'E2E Staff', '01E2STAFF', true);
    await insertStaff(sql, ENLACE_EMAIL, 'Enlace E2E', '01E2ENRAC0', false);
  } finally {
    await sql.end({ timeout: 5 });
  }
}
