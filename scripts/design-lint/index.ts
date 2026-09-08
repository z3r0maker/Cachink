/**
 * design-lint — enforce the Cachink design system in Tamagui source.
 *
 * ESLint sees JSX; it does not see that `color={colors.gray400}` fails WCAG
 * contrast or that a `<Pressable>` wrapping only an `<Icon>` is silent under
 * VoiceOver. This linter closes that gap. See `scan.ts` for the rule set.
 *
 * Ratcheting, not gatekeeping: the repo carries a baseline of known findings
 * and the gate fails only when a rule's count *increases*. Fixes lower the
 * baseline; new debt cannot be added silently.
 *
 * Usage:
 *   pnpm lint:design                  # check against the baseline
 *   pnpm lint:design --json           # machine-readable findings
 *   pnpm lint:design --update-baseline
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { scanFile, type Finding } from './scan';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const BASELINE_PATH = join(REPO_ROOT, '.design-lint-baseline.json');
const ROOTS = ['packages/ui/src', 'apps/mobile/src', 'apps/desktop/src'];

type RuleCounts = Readonly<Record<string, number>>;

function collectFiles(dir: string): readonly string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectFiles(full));
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function runScan(): readonly Finding[] {
  const findings: Finding[] = [];
  for (const root of ROOTS) {
    for (const file of collectFiles(join(REPO_ROOT, root))) {
      const rel = relative(REPO_ROOT, file);
      findings.push(...scanFile(rel, readFileSync(file, 'utf8')));
    }
  }
  return findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

function countByRule(findings: readonly Finding[]): RuleCounts {
  const counts: Record<string, number> = {};
  for (const f of findings) counts[f.rule] = (counts[f.rule] ?? 0) + 1;
  return counts;
}

function readBaseline(): RuleCounts | null {
  if (!existsSync(BASELINE_PATH)) return null;
  const parsed: unknown = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  const rules = (parsed as { rules?: RuleCounts }).rules;
  return rules ?? null;
}

function writeBaseline(counts: RuleCounts, total: number): void {
  const body = {
    $comment:
      'Ratchet for pnpm lint:design. Counts may fall, never rise. See scripts/design-lint/.',
    recordedAt: new Date().toISOString().slice(0, 10),
    total,
    rules: Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))),
  };
  writeFileSync(BASELINE_PATH, `${JSON.stringify(body, null, 2)}\n`);
}

/** Rules whose count grew since the baseline was recorded. */
function regressions(current: RuleCounts, baseline: RuleCounts): readonly string[] {
  return Object.keys(current)
    .filter((rule) => (current[rule] ?? 0) > (baseline[rule] ?? 0))
    .sort();
}

function printFindings(findings: readonly Finding[]): void {
  const order: Record<string, number> = { P1: 0, P2: 1, P3: 2 };
  for (const f of [...findings].sort(
    (a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3),
  )) {
    console.log(`  ${f.severity}  ${f.file}:${f.line}  ${f.rule}  (${f.detail})`);
  }
}

function printSummary(counts: RuleCounts, total: number): void {
  console.log('\nRULE                              COUNT');
  for (const [rule, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`${rule.padEnd(34)}${String(n).padStart(5)}`);
  }
  console.log(`${'TOTAL'.padEnd(34)}${String(total).padStart(5)}`);
}

function main(): void {
  const args = process.argv.slice(2);
  const findings = runScan();
  const counts = countByRule(findings);

  if (args.includes('--json')) {
    console.log(JSON.stringify(findings, null, 2));
    return;
  }
  if (args.includes('--update-baseline')) {
    writeBaseline(counts, findings.length);
    console.log(`design-lint: baseline updated — ${findings.length} findings.`);
    return;
  }

  printFindings(findings);
  printSummary(counts, findings.length);

  const baseline = readBaseline();
  if (baseline === null) {
    console.log('\ndesign-lint: no baseline yet. Run `pnpm lint:design --update-baseline`.');
    return;
  }
  const grown = regressions(counts, baseline);
  if (grown.length > 0) {
    console.error('\ndesign-lint: FAILED — these rules grew since the baseline:');
    for (const rule of grown) {
      console.error(`  ${rule}: ${baseline[rule] ?? 0} -> ${counts[rule] ?? 0}`);
    }
    console.error('\nFix the new findings, or justify the change and re-baseline.');
    process.exitCode = 1;
    return;
  }
  const improved = findings.length < (Object.values(baseline).reduce((a, b) => a + b, 0) || 0);
  console.log(
    improved
      ? '\ndesign-lint: PASSED — below baseline. Run --update-baseline to lock the gain in.'
      : '\ndesign-lint: PASSED — no rule grew since the baseline.',
  );
}

main();
