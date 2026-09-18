/**
 * Shared shapes for the design-lint rule modules.
 *
 * Split out of `scan.ts` so the token rules and the a11y rules can live in
 * their own files without importing each other (CLAUDE.md §2.6).
 */

export type Severity = 'P1' | 'P2' | 'P3';

export interface Finding {
  readonly rule: string;
  readonly severity: Severity;
  readonly file: string;
  readonly line: number;
  readonly detail: string;
}

/** Records a finding; `scanFile` supplies the `file` field. */
export type Push = (f: Omit<Finding, 'file'>) => void;

/** A rule that reads one raw source line at a time. */
export type LineRule = (raw: string, line: number, push: Push) => void;
