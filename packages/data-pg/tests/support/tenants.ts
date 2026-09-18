import type postgres from 'postgres';

/**
 * Two tenants, so isolation has something to isolate *from*.
 *
 * A single-tenant fixture cannot distinguish "the policy filters correctly"
 * from "the policy matches everything" — both return the same rows. Shared by
 * every suite that asserts on RLS (CLAUDE.md §2.3).
 */
export const BIZ_A = '01HZ8XQN9GZJXV8AKQ5X0C7AAA';
export const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7BBB';
const NOW = '2026-09-17T12:00:00.000Z';

/**
 * Inserts one business and one notice per tenant, idempotently.
 *
 * Writes through the session GUC rather than the JWT claim so that the claims
 * suite can seed without depending on the path it is about to test.
 */
export async function seedTwoTenants(sql: postgres.Sql): Promise<void> {
  for (const biz of [BIZ_A, BIZ_B]) {
    await sql`SELECT set_config('xangarro.business_id', ${biz}, false)`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, ${'Negocio ' + biz.slice(-3)}, 'RESICO', 125, ${biz}, 'dev', ${NOW}, ${NOW})
      ON CONFLICT (id) DO NOTHING`;
    await sql`
      INSERT INTO notices (id, source, severity, title, body, business_id, created_at, updated_at)
      VALUES (${'n-' + biz.slice(-3)}, 'operacion', 'info', 'Aviso', 'Cuerpo', ${biz}, ${NOW}, ${NOW})
      ON CONFLICT (id) DO NOTHING`;
  }
  await sql`SELECT set_config('xangarro.business_id', '', false)`;
}

/** A well-formed access token payload, as PostgREST would set it. */
export function claims(businessId: string): string {
  return JSON.stringify({
    sub: '3f1c0e2a-0000-4000-8000-000000000001',
    role: 'authenticated',
    business_id: businessId,
  });
}
