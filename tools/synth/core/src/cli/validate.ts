import { resolve } from 'node:path';

import { formatIssue, validateTree } from '../validate/tree';
import { existsUnder, readTree } from './read-tree';

/**
 * `pnpm --filter @xangarro/synth-core validate` (spec §5 `validate.ts`):
 * checks every YAML file of the harness and prints one `file: field: reason`
 * line per problem. Exits 1 when there is any, so a hook or CI can use it.
 */
const ROOT = resolve(import.meta.dirname, '../../..');

const files = readTree(ROOT);
const issues = validateTree(files, existsUnder(ROOT));

if (issues.length > 0) {
  for (const issue of issues) process.stderr.write(`${formatIssue(issue)}\n`);
  process.stderr.write(`\n${issues.length} problem(s) in tools/synth/\n`);
  process.exit(1);
}
process.stdout.write(`tools/synth/: ${files.length} file(s), all valid\n`);
