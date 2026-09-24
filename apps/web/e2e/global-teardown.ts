import { coverageEnabled } from '../scripts/coverage-gate/options';
import { addServerCoverageAndWrite } from './coverage';
import { removeSharedTenantGuard } from './shared-tenant';

/**
 * Runs before Playwright stops the server, so the server can still be asked.
 *
 * Two jobs: the E2E coverage stage collects the server's V8 profile (ADR-102),
 * and the shared-tenant guard comes off (ADR-103). The guard is test-only DDL
 * on a throwaway database and it goes at the end of every run, including a
 * failed one — a lock left behind would make the next `pnpm dev` against this
 * database refuse to save a product, with a message about Playwright projects.
 */
export default async function globalTeardown(): Promise<void> {
  if (coverageEnabled) await addServerCoverageAndWrite();
  await removeSharedTenantGuard();
}
