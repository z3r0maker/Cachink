/**
 * Operator CLI for staff accounts (N-05, ADR-080, ADR-160). Creating a staff
 * member or minting an enrolment link is never something the console itself
 * can do: its `xangarro_admin` role has no INSERT on `staff_members` or on
 * `staff_enrolment_links`. Run this with `DATABASE_URL` pointing at the
 * **owner** role, from a trusted machine:
 *
 *   DATABASE_URL=postgres://owner@… pnpm --filter @xangarro/backoffice staff create \
 *     --email ana@gmail.com --nombre "Ana"
 *
 * Each command prints a one-time link (15 minutes) that registers the member's
 * first passkey. Hand it over in person or on a channel you trust; it is never
 * emailed. `passkey-link --reset` is the every-device-lost path: it retires
 * the member's passkeys and ends their sessions before minting the link.
 */
import { createDb, type Db } from '@xangarro/data-pg';
import { newEntityId, type StaffMemberId } from '@xangarro/domain';
import { sql } from 'drizzle-orm';

import { enrolmentUrl, parseStaffArgs, USAGE, UsageError, type StaffCommand } from './staff-cli';
import { liveStaffId, mintEnrolmentLink, resetPasskeys } from './staff-links';

const link = (token: string) =>
  `\n  ${enrolmentUrl(token, process.env.ADMIN_BASE_URL)}\n\nvalid 15 minutes, once; open it on the member's phone or computer`;

async function create(db: Db, cmd: Extract<StaffCommand, { command: 'create' }>) {
  const id = newEntityId<StaffMemberId>();
  await db.execute(sql`
    INSERT INTO public.staff_members (id, email, nombre, created_at)
    VALUES (${id}, ${cmd.email}, ${cmd.nombre}, now())`);
  return `created staff member ${id} <${cmd.email}>; their passkey link:${link(await mintEnrolmentLink(db, id))}`;
}

async function passkeyLink(db: Db, email: string, reset: boolean) {
  const id = await liveStaffId(db, email);
  if (id === null) throw new UsageError(`no live staff member with email ${email}`);
  const retired = reset ? await resetPasskeys(db, id) : 0;
  const note = reset ? `retired ${retired} passkey(s) and ended their sessions; ` : '';
  return `${note}passkey link for ${id} <${email}>:${link(await mintEnrolmentLink(db, id))}`;
}

async function main(): Promise<void> {
  const cmd = parseStaffArgs(process.argv.slice(2));
  const url = process.env.DATABASE_URL;
  if (!url) throw new UsageError('DATABASE_URL (the owner role) is required');
  const db = createDb(url);
  const message =
    cmd.command === 'create' ? await create(db, cmd) : await passkeyLink(db, cmd.email, cmd.reset);
  console.log(message);
  process.exit(0);
}

/** Print only the database's own message (the `cause`), never the statement's parameters. */
function describe(error: unknown): string {
  const cause = error instanceof Error ? error.cause : undefined;
  if (cause instanceof Error) return cause.message;
  return error instanceof Error ? error.name : 'unknown error';
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) console.error(`staff: ${error.message}\n\n${USAGE}`);
  else console.error(`staff: failed — ${describe(error)}`);
  process.exit(1);
});
