/**
 * `pnpm --filter @xangarro/data-pg db:migrate:hosted [--dry-run]` (B-01).
 *
 * Provisions the hosted Supabase database: the four LOGIN roles, then every
 * migration not yet in the ledger — `hosted/`, `drizzle/`, then the admin
 * console's — each file in its own transaction, stopping at the first error.
 * Runbook: docs/ops/provisioning.md.
 *
 * Inputs (from `packages/data-pg/.env.local`, overridden by the real env):
 *   SUPERUSER_URL               Direct (5432) or Session-pooler (5432) string
 *                               for the `postgres` role. Never 6543.
 *   XANGARRO_APP_PASSWORD, XANGARRO_BILLING_PASSWORD,
 *   XANGARRO_METERING_PASSWORD, XANGARRO_ADMIN_PASSWORD
 *
 * Nothing secret is printed: the URL is masked and passwords reach the server
 * only as SCRAM verifiers. `--root <dir>` points at another checkout (the
 * self-test uses it); `--dry-run` writes nothing.
 */
import { join, resolve } from 'node:path';

import postgres, { type Sql } from 'postgres';

import { connectionHint, isLocalHost, loadEnvLocal, maskUrl, urlProblem } from './hosted/env';
import { applyMigration, ensureLedger, readApplied, unledgeredSchema } from './hosted/ledger';
import {
  listMigrations,
  MigrationPlanError,
  pendingMigrations,
  type MigrationFile,
} from './hosted/plan';
import { preflight } from './hosted/preflight';
import { ensureRole, LOGIN_ROLES, passwordProblem, roleActions } from './hosted/roles';
import { verifyPosture } from './hosted/verify';

const PACKAGE_DIR = resolve(import.meta.dirname, '..');

class UsageError extends Error {}

interface Options {
  readonly dryRun: boolean;
  readonly root: string;
}

function parseArgs(argv: readonly string[]): Options {
  let dryRun = false;
  let root = resolve(PACKAGE_DIR, '../..');
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') dryRun = true;
    else if (arg === '--root' && argv[i + 1] !== undefined) root = resolve(argv[++i] ?? '');
    else if (arg !== '--')
      throw new UsageError(`unknown argument ${arg ?? ''}; use --dry-run or --root <dir>`);
  }
  return { dryRun, root };
}

function readInputs(dryRun: boolean): { url: string; passwords: Map<string, string> } {
  const url = process.env.SUPERUSER_URL;
  const problem = urlProblem(url);
  if (problem === 'missing')
    throw new UsageError('SUPERUSER_URL is not set (packages/data-pg/.env.local).');
  if (problem === 'transaction-pooler') {
    throw new UsageError(
      'SUPERUSER_URL is the Transaction pooler (6543). Migrations need Direct or the Session pooler (5432).',
    );
  }
  const passwords = new Map<string, string>();
  const bad: string[] = [];
  for (const spec of LOGIN_ROLES) {
    const value = process.env[spec.env];
    const why = passwordProblem(value);
    if (why === null && value !== undefined) passwords.set(spec.role, value);
    else bad.push(`${spec.env} ${why ?? 'is invalid'}`);
  }
  if (bad.length > 0 && !dryRun)
    throw new UsageError(`${bad.join('; ')}. Generate with: openssl rand -base64 32`);
  for (const b of bad) console.log(`note      ${b} (needed for the real run)`);
  return { url: url ?? '', passwords };
}

async function provisionRoles(sql: Sql, passwords: Map<string, string>, dryRun: boolean) {
  const actions = await roleActions(sql);
  for (const spec of LOGIN_ROLES) {
    const action = actions.get(spec.role) ?? 'create';
    const line = `${spec.role} (${spec.usedBy}; statement_timeout ${spec.statementTimeout})`;
    if (dryRun) {
      console.log(`would ${action.padEnd(6)} role ${line}`);
      continue;
    }
    await ensureRole(sql, spec, passwords.get(spec.role) ?? '');
    console.log(`${action === 'create' ? 'created' : 'updated'}   role ${line}`);
  }
}

async function pending(sql: Sql, root: string): Promise<MigrationFile[]> {
  if (await unledgeredSchema(sql)) {
    throw new UsageError(
      'public.businesses exists but the ledger does not: this database was migrated by something else. Refusing.',
    );
  }
  return pendingMigrations(listMigrations(root), await readApplied(sql));
}

async function applyAll(sql: Sql, files: readonly MigrationFile[], dryRun: boolean): Promise<void> {
  if (!dryRun) await ensureLedger(sql);
  for (const file of files) {
    if (dryRun) {
      console.log(`would apply ${file.name}`);
      continue;
    }
    try {
      await applyMigration(sql, file);
    } catch (error) {
      throw new Error(`${file.name} failed and was rolled back: ${describe(error)}`);
    }
    console.log(`applied   ${file.name}`);
  }
  console.log(
    dryRun ? `${files.length} migration(s) would run.` : `${files.length} migration(s) applied.`,
  );
}

async function checkPreflight(sql: Sql, files: readonly MigrationFile[]): Promise<number> {
  const blockers = await preflight(sql, new Set(files.map((f) => f.name)));
  for (const b of blockers) {
    console.log(`BLOCKER   ${b.problem}`);
    if (b.fix !== undefined) console.log(`  fix:    ${b.fix}`);
  }
  if (blockers.length === 0) console.log('preflight ok');
  return blockers.length;
}

function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const pg = error as Error & { code?: string; hint?: string; where?: string };
  return [
    pg.message || 'connection failed',
    pg.code && `(${pg.code})`,
    pg.hint && `hint: ${pg.hint}`,
  ]
    .filter(Boolean)
    .join(' ');
}

async function run(sql: Sql, options: Options, passwords: Map<string, string>): Promise<void> {
  await sql`SET statement_timeout = 0`;
  await sql`SELECT pg_advisory_lock(hashtext('xangarro:migrate-hosted'))`;
  const files = await pending(sql, options.root);
  const blockers = await checkPreflight(sql, files);
  if (blockers > 0 && !options.dryRun)
    throw new UsageError(`${blockers} preflight blocker(s); nothing was written.`);
  await provisionRoles(sql, passwords, options.dryRun);
  await applyAll(sql, files, options.dryRun);
  const warnings = await verifyPosture(sql);
  for (const w of warnings) console.log(`WARNING   ${w}`);
  console.log(warnings.length === 0 ? 'posture   ok' : `posture   ${warnings.length} warning(s)`);
  if (blockers > 0)
    throw new UsageError(`dry run found ${blockers} preflight blocker(s); fix them first.`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const loaded = loadEnvLocal(join(PACKAGE_DIR, '.env.local'));
  const { url, passwords } = readInputs(options.dryRun);
  console.log(
    `target    ${maskUrl(url)}${loaded ? ' (inputs from .env.local)' : ''}${options.dryRun ? ' — DRY RUN' : ''}`,
  );
  const sql = postgres(url, {
    max: 1,
    prepare: false,
    onnotice: () => undefined,
    ssl: new URL(url).searchParams.has('sslmode') || isLocalHost(url) ? undefined : 'require',
    connection: { application_name: 'xangarro-migrate-hosted' },
  });
  try {
    await run(sql, options, passwords);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  const known = error instanceof UsageError || error instanceof MigrationPlanError;
  console.error(`error: ${known ? error.message : describe(error)}`);
  const hint = connectionHint(error);
  if (hint !== null) console.error(hint);
  process.exit(1);
});
