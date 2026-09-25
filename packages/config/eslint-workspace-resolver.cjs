'use strict';

/**
 * Import resolver (eslint-module-utils interface v2) that lets
 * eslint-plugin-boundaries classify workspace imports.
 *
 * Without it every `@xangarro/*` import resolved to nothing and the plugin
 * filed it as an external package, so no layer rule ever fired. Two things
 * defeat the stock node resolver here:
 *   1. pnpm (node-linker=hoisted) links a workspace package only into the
 *      node_modules of the packages that *declare* it. An import that crosses
 *      a boundary is almost always an undeclared one — domain does not depend
 *      on application — so it is unresolvable exactly when it matters.
 *   2. Sources import `./x.js` for a file that is `./x.ts`.
 *
 * So `@xangarro/<pkg>[/<sub>]` is mapped straight to the package's source via
 * its `exports`, and relative imports are tried against the TS extensions.
 * Anything else is left unresolved, which the plugin treats as external.
 */

const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');
const WORKSPACE_PARENTS = ['apps', 'packages'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

/** @type {Map<string, { dir: string, exports: unknown }> | undefined} */
let workspace;

function loadWorkspace() {
  const map = new Map();
  for (const parent of WORKSPACE_PARENTS) {
    const root = path.join(REPO, parent);
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(root, entry.name);
      const manifest = path.join(dir, 'package.json');
      if (!fs.existsSync(manifest)) continue;
      const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
      if (typeof pkg.name === 'string') map.set(pkg.name, { dir, exports: pkg.exports });
    }
  }
  return map;
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/** `./x.js` → `./x.ts`, `./x` → `./x.ts` or `./x/index.ts`. */
function resolveFile(target) {
  if (isFile(target)) return target;
  const stem = target.replace(/\.(?:[cm]?js|jsx)$/, '');
  for (const ext of EXTENSIONS) {
    if (isFile(stem + ext)) return stem + ext;
  }
  for (const ext of EXTENSIONS) {
    const index = path.join(target, `index${ext}`);
    if (isFile(index)) return index;
  }
  return null;
}

/** A conditional export (`{ types, import, default }`) → its first string target. */
function exportTarget(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    for (const key of ['types', 'import', 'default']) {
      const target = exportTarget(value[key]);
      if (target) return target;
    }
  }
  return null;
}

function resolveWorkspace(source) {
  const match = /^(@xangarro\/[^/]+)(\/.*)?$/.exec(source);
  if (!match) return undefined;
  workspace ??= loadWorkspace();
  const pkg = workspace.get(match[1]);
  if (!pkg) return null;
  const subpath = `.${match[2] ?? ''}`;
  const exportsMap =
    typeof pkg.exports === 'string' || pkg.exports?.['.'] === undefined
      ? { '.': pkg.exports }
      : pkg.exports;
  const target = exportTarget(exportsMap?.[subpath]);
  // A package without a matching export still belongs to its directory, which
  // is what boundary classification needs.
  return resolveFile(path.join(pkg.dir, target ?? subpath));
}

exports.interfaceVersion = 2;

exports.resolve = function resolve(source, file) {
  const workspaceHit = resolveWorkspace(source);
  if (workspaceHit !== undefined) {
    return workspaceHit ? { found: true, path: workspaceHit } : { found: false };
  }
  if (source.startsWith('.') || path.isAbsolute(source)) {
    const hit = resolveFile(path.resolve(path.dirname(file), source));
    return hit ? { found: true, path: hit } : { found: false };
  }
  return { found: false };
};
