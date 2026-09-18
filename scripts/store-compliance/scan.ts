/**
 * scan.ts — run the rules over extracted strings and apply the allowlist.
 */

import { extractStrings } from './extract';
import { matchRules } from './rules';

export interface Violation {
  readonly file: string;
  readonly line: number;
  readonly rule: string;
  readonly text: string;
  readonly key: string | null;
}

/** A reviewed, legitimate use. `text` must equal the extracted string exactly. */
export interface AllowEntry {
  readonly file: string;
  readonly text: string;
  readonly reason: string;
  /** Limit the exemption to one rule; omitted means every rule. */
  readonly rule?: string;
}

/** Every rule hit in one file, before the allowlist. */
export function scanSource(file: string, source: string): readonly Violation[] {
  const out: Violation[] = [];
  for (const s of extractStrings(file, source)) {
    for (const rule of matchRules(s.text, s.codeToken)) {
      out.push({ file, line: s.line, rule, text: s.text, key: s.key });
    }
  }
  return out;
}

function allows(entry: AllowEntry, v: Violation): boolean {
  return entry.file === v.file && entry.text === v.text && (entry.rule ?? v.rule) === v.rule;
}

export interface Filtered {
  readonly violations: readonly Violation[];
  readonly suppressed: number;
  /** Allowlist entries that matched nothing — stale, and should be removed. */
  readonly unused: readonly AllowEntry[];
}

export function applyAllowlist(
  found: readonly Violation[],
  allow: readonly AllowEntry[],
): Filtered {
  const used = new Set<AllowEntry>();
  const violations = found.filter((v) => {
    const hit = allow.find((e) => allows(e, v));
    if (hit) used.add(hit);
    return hit === undefined;
  });
  return {
    violations,
    suppressed: found.length - violations.length,
    unused: allow.filter((e) => !used.has(e)),
  };
}
