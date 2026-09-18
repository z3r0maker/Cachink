/**
 * Generates `DESIGN_CONTRACT.md` from `@xangarro/tokens`.
 *
 * The document itself is assembled in `./render`; this file is only the CLI.
 * Task P-19, ADR-057.
 *
 *   pnpm design:contract           # write the file
 *   pnpm design:contract --check   # fail if it would change (CI)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from './render';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const OUT = join(REPO_ROOT, 'DESIGN_CONTRACT.md');

const out = render();
if (process.argv.includes('--check')) {
  const current = readFileSync(OUT, 'utf8');
  if (current !== out) {
    console.error('DESIGN_CONTRACT.md is stale. Run `pnpm design:contract`.');
    process.exit(1);
  }
  console.log('DESIGN_CONTRACT.md is up to date.');
} else {
  writeFileSync(OUT, out);
  console.log(`Wrote ${OUT}`);
}
