/**
 * The service-role guard's logic (N-05, ADR-063).
 *
 * The Supabase service-role key bypasses RLS for every tenant. It belongs to
 * the admin console's Vercel project and nowhere else; in the customer portal
 * one bug would expose every business. This finds any mention of the variable
 * under a directory tree — code, config, `.env*` files, docs — because a
 * reference in a comment or an example env file is how a real one starts.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const FORBIDDEN_NAME = 'SUPABASE_SERVICE_ROLE_KEY';

/** Build output and dependencies are not source; everything else is scanned. */
const SKIP_DIRS: ReadonlySet<string> = new Set([
  'node_modules',
  '.next',
  '.turbo',
  'test-results',
  'playwright-report',
]);

/** Files above this size are generated artefacts, never hand-written config. */
const MAX_BYTES = 2 * 1024 * 1024;

export interface Finding {
  readonly file: string;
  readonly line: number;
}

/** Every line of `content` that names the forbidden variable. */
export function scanText(file: string, content: string): readonly Finding[] {
  return content
    .split('\n')
    .flatMap((text, i) => (text.includes(FORBIDDEN_NAME) ? [{ file, line: i + 1 }] : []));
}

function walk(dir: string): readonly string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && statSync(full).size <= MAX_BYTES) out.push(full);
  }
  return out;
}

/** Scan a whole tree. Paths in the result are relative to `root`. */
export function scanTree(root: string): readonly Finding[] {
  return walk(root).flatMap((file) => scanText(relative(root, file), readFileSync(file, 'utf8')));
}
