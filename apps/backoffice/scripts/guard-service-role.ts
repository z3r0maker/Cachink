/**
 * CI guard: fails if the Supabase service-role key is referenced anywhere in
 * the repository's code outside `apps/backoffice/` (N-05, ADR-063; widened
 * from `apps/web/` by N-81, ADR-140).
 *
 * Runs as the tail of `@xangarro/backoffice`'s `lint` task, so `pnpm lint` — which
 * CI already gates on — enforces it with no workflow change.
 *
 *   pnpm --filter @xangarro/backoffice exec tsx scripts/guard-service-role.ts
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { FORBIDDEN_NAME, GUARDED_ROOTS, scanRepo } from './service-role-guard';

const REPO = resolve(import.meta.dirname, '..', '..', '..');
const PORTAL = resolve(REPO, 'apps', 'web');

if (!existsSync(PORTAL)) {
  // A missing portal is a broken checkout, not a pass.
  console.error(`guard-service-role: ${PORTAL} does not exist.`);
  process.exit(2);
}

const findings = scanRepo(REPO);
if (findings.length > 0) {
  console.error(`guard-service-role: ${FORBIDDEN_NAME} is referenced outside apps/backoffice/:`);
  for (const f of findings) console.error(`  ${f.file}:${f.line}`);
  console.error('The service-role key belongs to apps/backoffice only (ADR-063).');
  process.exit(1);
}
console.log(`guard-service-role: ${GUARDED_ROOTS.join(', ')} are clean of ${FORBIDDEN_NAME}.`);
