/**
 * report.ts — human-readable output for the store-compliance check.
 */

import { RULES } from './rules';
import type { AllowEntry, Violation } from './scan';

function byFile(violations: readonly Violation[]): Map<string, Violation[]> {
  const groups = new Map<string, Violation[]>();
  for (const v of violations) {
    const list = groups.get(v.file) ?? [];
    list.push(v);
    groups.set(v.file, list);
  }
  return groups;
}

function clip(text: string): string {
  const flat = text.replace(/\s+/g, ' ');
  return flat.length > 110 ? `${flat.slice(0, 107)}...` : flat;
}

/** Violations grouped by file, then a per-rule summary with suggested wording. */
export function formatReport(
  violations: readonly Violation[],
  suppressed: number,
  unused: readonly AllowEntry[],
): string {
  const lines: string[] = [];
  for (const [file, list] of byFile(violations)) {
    lines.push(file);
    for (const v of list) {
      const key = v.key ? ` [${v.key}]` : '';
      lines.push(`  ${v.line}  ${v.rule}${key}  "${clip(v.text)}"`);
    }
    lines.push('');
  }
  for (const rule of RULES) {
    const n = violations.filter((v) => v.rule === rule.id).length;
    if (n > 0)
      lines.push(
        `${rule.id.padEnd(22)}${String(n).padStart(4)}  ${rule.message} → ${rule.suggestion}`,
      );
  }
  for (const e of unused) lines.push(`stale allowlist entry: ${e.file} "${clip(e.text)}"`);
  const verdict = violations.length === 0 ? 'PASSED' : 'FAILED';
  lines.push(
    `store-compliance: ${verdict} — ${violations.length} violations, ${suppressed} allowlisted.`,
  );
  return lines.join('\n');
}
