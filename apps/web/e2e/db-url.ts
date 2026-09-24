import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * The two database URLs the suite needs beyond `DATABASE_URL`, resolved the
 * same way from both sides of the run: `playwright.config.ts` (which hands them
 * to the Next server) and the global setup (which locks the shared tenant on
 * the owner connection).
 *
 * They are computed from `db-local.sh` rather than hard-coded, so a session
 * running an isolated stack — `XG_PG_PORT`, see that script — gets its own
 * roles instead of silently writing to the default container on 55432.
 */
const SCRIPT = path.resolve(import.meta.dirname, '../../../packages/data-pg/scripts/db-local.sh');

function ask(role: 'billing-url' | 'super-url'): string {
  return execFileSync(SCRIPT, [role]).toString().trim();
}

/**
 * The billing DB, where `seed-billing.ts` put the subscriptions the
 * Suscripción/Facturas/data specs assert. The server has no default for it —
 * without this, those pages render their error state and half the suite
 * sweeps error cards (the exact rot the seeded-DB check exists to prevent).
 * CI provides its own; locally it is the same docker Postgres, other role.
 */
export function billingDatabaseUrl(): string {
  return process.env.BILLING_DATABASE_URL ?? ask('billing-url');
}

/**
 * The throwaway database's owner, for test-only work the app role cannot do:
 * resets (the throttle table's grants are function-only by design) and the
 * shared-tenant guard's triggers.
 */
export function superDatabaseUrl(): string {
  return process.env.DATABASE_SUPER_URL ?? ask('super-url');
}
