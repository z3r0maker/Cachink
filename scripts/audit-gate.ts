/**
 * audit-gate.ts — fail CI on a high or critical advisory that can reach users
 * (SEC-SUP-01, N-26). Reads `pnpm audit --prod --json` and the reviewed
 * allowlist `security/audit-allowlist.json`; the rule is `audit-gate-rules.ts`.
 *
 *   pnpm audit:gate
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { blocking, findingsOf, type AllowEntry } from './audit-gate-rules.js';

const ROOT = join(fileURLToPath(import.meta.url), '../..');

function main(auditPath: string): number {
  const audit = JSON.parse(readFileSync(auditPath, 'utf8')) as Parameters<typeof findingsOf>[0];
  const allow = JSON.parse(
    readFileSync(join(ROOT, 'security/audit-allowlist.json'), 'utf8'),
  ) as AllowEntry[];
  const today = new Date().toISOString().slice(0, 10);
  const fails = blocking(findingsOf(audit), allow, today);
  for (const f of fails) {
    process.stderr.write(
      `${f.severity.toUpperCase()} ${f.module} ${f.ghsa}\n  ${f.paths[0] ?? ''}\n`,
    );
  }
  if (fails.length > 0) {
    process.stderr.write(
      `audit gate: ${fails.length} advisory(ies) reach users — upgrade or override, or add a reviewed entry to security/audit-allowlist.json\n`,
    );
    return 1;
  }
  process.stdout.write('audit gate: no high or critical advisory reaches users\n');
  return 0;
}

process.exitCode = main(process.argv[2] ?? '.audit.json');
