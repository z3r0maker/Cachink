/**
 * Operator CLI: name a staff member as one of MEXIA's founders (E-01,
 * ADR-124 §1). The console never writes corp.founders; this runs with
 * `DATABASE_URL` pointing at the **owner** role, from a trusted machine, once
 * per founder. The staff member must already exist (`pnpm … staff create`).
 *
 *   DATABASE_URL=postgres://owner@… pnpm --filter @xangarro/backoffice founder add \
 *     --email ana@mexia.mx --numero 1 --nombre "Ana" [--rfc ANAA800101AB1]
 */
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

import { FOUNDER_USAGE, parseFounderArgs } from './founder-cli';
import { UsageError } from './staff-cli';

async function main(): Promise<void> {
  const cmd = parseFounderArgs(process.argv.slice(2));
  const url = process.env.DATABASE_URL;
  if (!url) throw new UsageError('DATABASE_URL (the owner role) is required');
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    const [staff] = await sql<{ id: string }[]>`
      SELECT id FROM public.staff_members
       WHERE lower(email) = ${cmd.email} AND revoked_at IS NULL`;
    if (staff === undefined) throw new UsageError(`no live staff member with email ${cmd.email}`);
    await sql`
      INSERT INTO corp.founders (id, staff_member_id, numero, nombre, rfc, created_at)
      VALUES (${randomUUID()}, ${staff.id}, ${cmd.numero}, ${cmd.nombre}, ${cmd.rfc}, now())`;
    console.log(`staff ${staff.id} <${cmd.email}> is now Fundador ${cmd.numero}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) console.error(`founder: ${error.message}\n\n${FOUNDER_USAGE}`);
  else
    console.error(`founder: failed — ${error instanceof Error ? error.message : 'unknown error'}`);
  process.exit(1);
});
