/**
 * store-compliance — keep the mobile app free of in-app selling (ADR-069, N-32).
 *
 * In Mexico the App Store does not allow a free companion app to name plans,
 * show prices, call users to buy or upgrade, or steer them to buy on the web;
 * Guideline 3.1.1 also treats licence keys that unlock features as in-app
 * purchase. This check extracts every user-visible string from the mobile
 * bundle's sources (see `files.ts`) and fails on any rule hit (`rules.ts`)
 * that is not in the reviewed `allowlist.json`.
 *
 * Usage:
 *   pnpm lint:store                 # report; exit 1 when violations exist
 *   pnpm lint:store --json          # machine-readable result
 *   pnpm lint:store --root <dir>    # scan another checkout (e.g. a git archive)
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { collectMobileSources } from './files';
import { formatReport } from './report';
import { applyAllowlist, scanSource, type AllowEntry, type Violation } from './scan';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const ALLOWLIST_PATH = join(import.meta.dirname, 'allowlist.json');

function readAllowlist(): readonly AllowEntry[] {
  const parsed = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8')) as { entries?: AllowEntry[] };
  return parsed.entries ?? [];
}

function rootArg(args: readonly string[]): string {
  const i = args.indexOf('--root');
  const value = i >= 0 ? args[i + 1] : undefined;
  return value ? resolve(value) : REPO_ROOT;
}

function scanTree(root: string): readonly Violation[] {
  return collectMobileSources(root).flatMap((file) =>
    scanSource(file, readFileSync(join(root, file), 'utf8')),
  );
}

function main(): void {
  const args = process.argv.slice(2);
  const { violations, suppressed, unused } = applyAllowlist(
    scanTree(rootArg(args)),
    readAllowlist(),
  );
  if (args.includes('--json')) {
    console.log(JSON.stringify({ violations, suppressed, unusedAllowlist: unused }, null, 2));
  } else {
    console.log(formatReport(violations, suppressed, unused));
  }
  if (violations.length > 0) process.exitCode = 1;
}

main();
