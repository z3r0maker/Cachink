/**
 * The pure half of `scripts/founder.ts`: argument parsing, tested without a
 * database. Shares the flag parser with the staff CLI (CLAUDE.md §2.3).
 */
import { EMAIL, flags, text, UsageError } from './staff-cli';

export interface FounderAdd {
  readonly command: 'add';
  readonly email: string;
  readonly numero: 1 | 2;
  readonly nombre: string;
  readonly rfc: string | null;
}

export const FOUNDER_USAGE = `usage:
  DATABASE_URL=<owner role> pnpm --filter @xangarro/backoffice founder add \\
    --email <staff email> --numero <1|2> --nombre <nombre> [--rfc <RFC>]`;

/** Persona física RFC: 4 letters, 6 digits, 3 homoclave characters (13); moral: 3 letters (12). */
const RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;

export function parseFounderArgs(argv: readonly string[]): FounderAdd {
  const [command, ...rest] = argv;
  if (command !== 'add') throw new UsageError(`unknown command: ${command ?? '(none)'}`);
  const f = flags(rest);
  const email = text(f, 'email').toLowerCase();
  if (!EMAIL.test(email)) throw new UsageError(`not an email address: ${email}`);
  const numero = Number(text(f, 'numero'));
  if (numero !== 1 && numero !== 2) throw new UsageError('--numero must be 1 or 2');
  const raw = f.get('rfc');
  const rfc = typeof raw === 'string' ? raw.trim().toUpperCase() : null;
  if (rfc !== null && !RFC.test(rfc)) throw new UsageError(`not an RFC: ${rfc}`);
  return { command, email, numero, nombre: text(f, 'nombre'), rfc };
}
