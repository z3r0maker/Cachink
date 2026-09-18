/**
 * Operator CLI for staff accounts (N-05, ADR-080). Creating a staff member or
 * setting a password is never something the console itself can do: its
 * `xangarro_admin` role has no INSERT on `staff_members` and no UPDATE on
 * `password_hash`. Run this with `DATABASE_URL` pointing at the **owner**
 * role, from a trusted machine.
 *
 *   read -rs PASSWORD && printf %s "$PASSWORD" | \
 *     DATABASE_URL=postgres://owner@… pnpm --filter @xangarro/admin staff create \
 *       --email ana@xangarro.mx --nombre "Ana"
 *
 * The password comes from stdin only (never argv, which `ps` and shell history
 * see) and nothing secret is printed. The TOTP is enrolled by the staff member
 * at first sign-in. `set-password --reset-totp` is the lost-phone path: it
 * clears the authenticator and recovery codes so they enrol again, and every
 * set-password ends all of that member's sessions.
 */
import { hashPassword } from '@xangarro/auth-core';
import { createDb, type Db } from '@xangarro/data-pg';
import { newEntityId, type StaffMemberId } from '@xangarro/domain';
import { sql } from 'drizzle-orm';

import { parseStaffArgs, readPassword, USAGE, UsageError, type StaffCommand } from './staff-cli';

async function stdin(): Promise<string> {
  if (process.stdin.isTTY) throw new UsageError('pipe the password in on stdin');
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

async function create(db: Db, cmd: Extract<StaffCommand, { command: 'create' }>, hash: string) {
  const id = newEntityId<StaffMemberId>();
  await db.execute(sql`
    INSERT INTO public.staff_members (id, email, nombre, created_at, password_hash)
    VALUES (${id}, ${cmd.email}, ${cmd.nombre}, now(), ${hash})`);
  return `created staff member ${id} <${cmd.email}>; they enrol their authenticator at first sign-in`;
}

async function setPassword(db: Db, email: string, resetTotp: boolean, hash: string) {
  const [row] = await db.execute<{ id: string }>(sql`
    UPDATE public.staff_members SET password_hash = ${hash}
      ${resetTotp ? sql`, totp_secret_enc = NULL, totp_enrolled_at = NULL, totp_last_step = NULL, recovery_codes = '{}'` : sql``}
    WHERE lower(email) = ${email} AND revoked_at IS NULL
    RETURNING id`);
  if (row === undefined) throw new UsageError(`no live staff member with email ${email}`);
  await db.execute(sql`
    UPDATE public.staff_sessions SET revoked_at = now()
    WHERE staff_id = ${row.id} AND revoked_at IS NULL`);
  const totp = resetTotp ? '; authenticator cleared, they enrol again' : '';
  return `password set for ${row.id} <${email}>; sessions ended${totp}`;
}

async function main(): Promise<void> {
  const cmd = parseStaffArgs(process.argv.slice(2));
  const url = process.env.DATABASE_URL;
  if (!url) throw new UsageError('DATABASE_URL (the owner role) is required');
  const hash = await hashPassword(readPassword(await stdin()));
  const db = createDb(url);
  const message =
    cmd.command === 'create'
      ? await create(db, cmd, hash)
      : await setPassword(db, cmd.email, cmd.resetTotp, hash);
  console.log(message);
  process.exit(0);
}

/**
 * Drizzle's query errors quote the statement's parameters — here, the new
 * password hash. Print only the database's own message (the `cause`).
 */
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
