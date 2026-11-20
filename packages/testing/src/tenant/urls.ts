import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * The database URLs a fixture needs, resolved the same way for every caller:
 * the portal's Playwright config and global setup, its specs, and Synth's
 * corrida stack (ADR-153).
 *
 * The two privileged ones are computed from `db-local.sh` rather than
 * hard-coded, so a session running an isolated stack (`XG_PG_NAME` /
 * `XG_PG_PORT`, see that script) gets its own roles instead of silently
 * writing to the default container on 55432.
 */
const SCRIPT = path.resolve(import.meta.dirname, '../../../data-pg/scripts/db-local.sh');

function ask(role: 'billing-url' | 'super-url'): string {
  return execFileSync(SCRIPT, [role]).toString().trim();
}

/** A fixture asked for a database nobody configured. */
export class FixtureDatabaseError extends Error {
  readonly code = 'FIXTURE_DATABASE_UNSET';
  constructor(variable: string) {
    super(
      `${variable} is unset. Fixtures write through the app role; start a database with ` +
        '`pnpm --filter @xangarro/data-pg db:reset` and pass its URL.',
    );
    this.name = 'FixtureDatabaseError';
  }
}

/**
 * The app role, the one RLS binds. Required: an unset variable used to fall
 * through to the driver's default host, which reads as a connection refused
 * somewhere unrelated.
 */
export function appDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === '') throw new FixtureDatabaseError('DATABASE_URL');
  return url;
}

/**
 * The billing DB, where `seed-billing.ts` put the subscriptions the
 * Suscripción/Facturas/data specs assert, and where `mintTenant` writes a
 * plan. CI provides its own; locally it is the same Postgres, another role.
 */
export function billingDatabaseUrl(): string {
  return process.env.BILLING_DATABASE_URL ?? ask('billing-url');
}

/**
 * The throwaway database's owner, for test-only work the app role cannot do:
 * resets (the throttle table's grants are function-only by design), hard
 * deletes (data-pg 0036) and the shared-tenant guard's triggers.
 */
export function superDatabaseUrl(): string {
  return process.env.DATABASE_SUPER_URL ?? ask('super-url');
}
