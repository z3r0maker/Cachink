/**
 * CI guard: fails if the Supabase service-role key is referenced anywhere
 * under `apps/portal/` (N-05, ADR-063).
 *
 * Runs as the tail of `@xangarro/admin`'s `lint` task, so `pnpm lint` — which
 * CI already gates on — enforces it with no workflow change.
 *
 *   pnpm --filter @xangarro/admin exec tsx scripts/guard-service-role.ts
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { FORBIDDEN_NAME, scanTree } from './service-role-guard';

const PORTAL = resolve(import.meta.dirname, '..', '..', 'portal');

if (!existsSync(PORTAL)) {
  // A missing portal is a broken checkout, not a pass.
  console.error(`guard-service-role: ${PORTAL} does not exist.`);
  process.exit(2);
}

const findings = scanTree(PORTAL);
if (findings.length > 0) {
  console.error(`guard-service-role: ${FORBIDDEN_NAME} is referenced under apps/portal/:`);
  for (const f of findings) console.error(`  apps/portal/${f.file}:${f.line}`);
  console.error('The service-role key belongs to apps/admin only (ADR-063).');
  process.exit(1);
}
console.log(`guard-service-role: apps/portal/ is clean of ${FORBIDDEN_NAME}.`);
