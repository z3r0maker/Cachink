/**
 * The pure half of `scripts/staff.ts`: argument parsing and the password rule.
 * Kept apart so it is tested without a database (like service-role-guard.ts).
 */
import { MAX_PASSWORD_BYTES } from '@xangarro/auth-core';

export const MIN_PASSWORD_LENGTH = 12;

export type StaffCommand =
  | { readonly command: 'create'; readonly email: string; readonly nombre: string }
  | { readonly command: 'set-password'; readonly email: string; readonly resetTotp: boolean };

export class UsageError extends Error {
  readonly code = 'USAGE';
}

export const USAGE = `usage (the password is read from stdin, never from arguments):
  printf %s "$PASSWORD" | pnpm --filter @xangarro/admin staff create --email <email> --nombre <nombre>
  printf %s "$PASSWORD" | pnpm --filter @xangarro/admin staff set-password --email <email> [--reset-totp]`;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function flags(args: readonly string[]): Map<string, string | true> {
  const out = new Map<string, string | true>();
  for (let i = 0; i < args.length; i++) {
    const a = args[i] ?? '';
    if (!a.startsWith('--')) throw new UsageError(`unexpected argument: ${a}`);
    const next = args[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      out.set(a.slice(2), next);
      i++;
    } else out.set(a.slice(2), true);
  }
  return out;
}

function text(f: Map<string, string | true>, name: string): string {
  const v = f.get(name);
  if (typeof v !== 'string' || v.trim() === '') throw new UsageError(`--${name} is required`);
  return v.trim();
}

export function parseStaffArgs(argv: readonly string[]): StaffCommand {
  const [command, ...rest] = argv;
  const f = flags(rest);
  const email = text(f, 'email').toLowerCase();
  if (!EMAIL.test(email)) throw new UsageError(`not an email address: ${email}`);
  if (command === 'create') return { command, email, nombre: text(f, 'nombre') };
  if (command === 'set-password') {
    return { command, email, resetTotp: f.get('reset-totp') === true };
  }
  throw new UsageError(`unknown command: ${command ?? '(none)'}`);
}

/** The password as piped in: one trailing newline (from `echo`) is not part of it. */
export function readPassword(raw: string): string {
  const password = raw.replace(/\r?\n$/, '');
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new UsageError(`the password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new UsageError(`the password must be at most ${MAX_PASSWORD_BYTES} bytes`);
  }
  return password;
}
