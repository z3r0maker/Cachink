/**
 * The operator's inputs for `db:migrate:hosted`, and how the script talks
 * about them without leaking them.
 */
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

/**
 * Load `packages/data-pg/.env.local` (gitignored). A variable already set in
 * the real environment wins, so a one-off `SUPERUSER_URL=… pnpm …` overrides
 * the file. Returns whether the file was found.
 */
export function loadEnvLocal(path: string, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!existsSync(path)) return false;
  const parsed = parseEnv(readFileSync(path, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    if (env[key] === undefined && value !== undefined) env[key] = value;
  }
  return true;
}

/** `postgres://user:***@host:port/db` — never the password, never the query. */
export function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    const auth = u.username ? `${decodeURIComponent(u.username)}${u.password ? ':***' : ''}@` : '';
    return `${u.protocol}//${auth}${u.host}${u.pathname}`;
  } catch {
    return '<unparseable URL>';
  }
}

export type UrlProblem = 'missing' | 'transaction-pooler' | null;

/** Migrations need a session: Direct (5432) or the Session pooler (5432). */
export function urlProblem(url: string | undefined): UrlProblem {
  if (url === undefined || url === '') return 'missing';
  try {
    return new URL(url).port === '6543' ? 'transaction-pooler' : null;
  } catch {
    return 'missing';
  }
}

export function isLocalHost(url: string): boolean {
  const host = new URL(url).hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

const UNREACHABLE = new Set([
  'ENETUNREACH',
  'EHOSTUNREACH',
  'EADDRNOTAVAIL',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'CONNECT_TIMEOUT',
]);

/**
 * Supabase's Direct host (`db.<ref>.supabase.co`) is IPv6-only without the paid
 * IPv4 add-on, and many home networks cannot reach it.
 */
export function connectionHint(error: unknown): string | null {
  const code = (error as { code?: unknown }).code;
  if (typeof code !== 'string' || !UNREACHABLE.has(code)) return null;
  return [
    `Could not reach the database (${code}).`,
    'The Direct host db.<ref>.supabase.co is IPv6-only unless the IPv4 add-on is enabled.',
    'Use the Session pooler instead — copy it from Dashboard → Connect → Session pooler; it looks like:',
    '  postgres://postgres.jijggmddzacwcldwnmzj:<password>@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
    'Never the Transaction pooler (port 6543): it is for app runtime only.',
  ].join('\n');
}
