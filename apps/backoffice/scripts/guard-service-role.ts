/**
 * CI guard: fails if the Supabase service-role key is referenced anywhere
 * under `apps/web/` (N-05, ADR-063).
 *
 * Runs as the tail of `@xangarro/backoffice`'s `lint` task, so `pnpm lint` — which
 * CI already gates on — enforces it with no workflow change.
 *
 *   pnpm --filter @xangarro/backoffice exec tsx scripts/guard-service-role.ts
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { FORBIDDEN_NAME, scanTree } from './service-role-guard';

const PORTAL = resolve(import.meta.dirname, '..', '..', 'web');

if (!existsSync(PORTAL)) {
  // A missing portal is a broken checkout, not a pass.
  console.error(`guard-service-role: ${PORTAL} does not exist.`);
  process.exit(2);
}

const findings = scanTree(PORTAL);
if (findings.length > 0) {
  console.error(`guard-service-role: ${FORBIDDEN_NAME} is referenced under apps/web/:`);
  for (const f of findings) console.error(`  apps/web/${f.file}:${f.line}`);
  console.error('The service-role key belongs to apps/backoffice only (ADR-063).');
  process.exit(1);
}
console.log(`guard-service-role: apps/web/ is clean of ${FORBIDDEN_NAME}.`);
