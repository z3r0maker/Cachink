import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import type { SourceFile } from '../validate/tree';

/** The folders whose YAML the harness reads, relative to `tools/synth/`. */
const FOLDERS = ['personas', 'scenarios', 'matrix'] as const;

const isYaml = (name: string): boolean => /\.ya?ml$/.test(name);

/** Every file under `dir`, depth first, skipping `personas/evidence/` (sources, not YAML to check). */
function walk(root: string, dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    const rel = relative(root, full).split(sep).join('/');
    if (entry.isDirectory()) return rel === 'personas/evidence' ? [] : walk(root, full);
    return isYaml(entry.name) ? [rel] : [];
  });
}

/**
 * The harness's YAML under `root` (normally `tools/synth/`), with paths
 * relative to it and in a stable order, ready for `validateTree`. A missing
 * folder is simply empty: the tree checker says what is missing.
 */
export function readTree(root: string): SourceFile[] {
  const paths = [
    ...readdirSync(root).filter((n) => isYaml(n) && statSync(join(root, n)).isFile()),
    ...FOLDERS.flatMap((f) => walk(root, join(root, f))),
  ].sort();
  return paths.map((path) => ({ path, text: readFileSync(join(root, path), 'utf8') }));
}

/** `exists` for `validateTree`: a file, relative to `root`, that is really there. */
export function existsUnder(root: string): (path: string) => boolean {
  return (path) => {
    const full = join(root, path);
    return existsSync(full) && statSync(full).isFile();
  };
}
