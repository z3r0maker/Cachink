/**
 * files.ts — the source files that end up in the mobile app bundle.
 *
 * Roots are the Expo app and the shared UI package (which holds the es-MX
 * i18n catalog). Excluded: tests, stories, type declarations, parked code in
 * `archive/`, and platform files Metro never resolves for iOS/Android
 * (`*.web.ts(x)`, used only by the desktop/web builds).
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const SCAN_ROOTS = ['apps/mobile/src', 'packages/ui/src'] as const;

const SKIP_DIRS = new Set(['node_modules', 'archive', '__tests__', '__mocks__', 'dist']);

/** True when a repo-relative path is shipped in the iOS/Android bundle. */
export function isMobileSource(relPath: string): boolean {
  const parts = relPath.split(/[\\/]/);
  if (parts.some((p) => SKIP_DIRS.has(p) || p.startsWith('.'))) return false;
  const name = parts[parts.length - 1] ?? '';
  if (!/\.tsx?$/.test(name) || name.endsWith('.d.ts')) return false;
  return !/\.(test|spec|stories|web)\.tsx?$/.test(name);
}

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
}

/** Repo-relative (POSIX) paths of every mobile-bundle source under `repoRoot`. */
export function collectMobileSources(repoRoot: string): readonly string[] {
  const files: string[] = [];
  for (const root of SCAN_ROOTS) {
    const abs = join(repoRoot, root);
    if (existsSync(abs)) walk(abs, files);
  }
  return files
    .map((f) => relative(repoRoot, f).split(sep).join('/'))
    .filter(isMobileSource)
    .sort();
}
