import { asOwner } from '@xangarro/testing/tenant';

/**
 * The business a signup made (S-10, `sin-cuenta`): the one whose owner is the
 * address the runner gave the actor. A run that starts with no tenant learns
 * its business here, after the actor is done. Read through the owner
 * connection, since no tenant is set yet to scope it by; it reads one id and
 * nothing else, and every check then runs under that tenant's RLS.
 */
export async function businessOf(email: string): Promise<string | null> {
  const rows = await asOwner(
    (sql) => sql`
      SELECT m.business_id
      FROM business_members m JOIN auth.users u ON u.id::text = m.user_id
      WHERE lower(u.email) = lower(${email}) AND m.role = 'owner'
      ORDER BY m.created_at
      LIMIT 1`,
  );
  const id = rows[0]?.business_id;
  return typeof id === 'string' ? id : null;
}
