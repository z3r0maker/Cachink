/**
 * The pure half of `scripts/staff.ts`: argument parsing and the link's URL.
 * Kept apart so it is tested without a database (like service-role-guard.ts).
 */
import { DEFAULT_CONSOLE_URL } from '../src/server/alerts/webhook-notifier';
import { ENROL_PATH } from '../src/server/gate';

export type StaffCommand =
  | { readonly command: 'create'; readonly email: string; readonly nombre: string }
  | { readonly command: 'passkey-link'; readonly email: string; readonly reset: boolean };

export class UsageError extends Error {
  readonly code = 'USAGE';
}

export const USAGE = `usage (DATABASE_URL is the owner role; each prints a one-time link, valid 15 minutes):
  pnpm --filter @xangarro/backoffice staff create --email <email> --nombre <nombre>
  pnpm --filter @xangarro/backoffice staff passkey-link --email <email> [--reset]

  --reset also removes every passkey of that member and ends their sessions:
  the path when all of their devices are lost.`;

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function flags(args: readonly string[]): Map<string, string | true> {
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

export function text(f: Map<string, string | true>, name: string): string {
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
  if (command === 'passkey-link') return { command, email, reset: f.get('reset') === true };
  throw new UsageError(`unknown command: ${command ?? '(none)'}`);
}

/**
 * Where the printed link goes: the console's link page, the token in the
 * fragment, which the browser never sends, so no server log ever holds it.
 */
export function enrolmentUrl(token: string, baseUrl: string | undefined): string {
  const base = new URL(baseUrl === undefined || baseUrl === '' ? DEFAULT_CONSOLE_URL : baseUrl);
  return `${base.origin}${ENROL_PATH}#${token}`;
}
