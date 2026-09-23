/**
 * adr-index.ts — regenerate the Index table at the top of `ARCHITECTURE.md`.
 *
 * The decision log is append-only, so its table of contents is the one part
 * that can rot: on 2026-09-23 the body held 99 ADRs and the index listed 48.
 * Half the log was unreachable from its own contents. A hand-kept index of a
 * file that only ever grows will drift again, so it is generated — the same
 * contract as `plan-board.ts` and `design-contract`.
 *
 * The ADR bodies stay the source of truth. Only the rows between the two
 * `ADR-INDEX` markers are rewritten; nothing else in the file is touched.
 *
 * Usage: `pnpm adr:index` (writes) · `pnpm adr:index --check` (exit 1 when stale).
 * `adr-index.test.ts` runs the check, so a new ADR without a row fails CI.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LOG = 'ARCHITECTURE.md';
const OPEN = '<!-- ADR-INDEX -->';
const CLOSE = '<!-- END ADR-INDEX -->';

export type Adr = {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly status: string;
};

/** Everything before the Context section: the log writes its header fields there and nowhere else. */
function header(body: readonly string[]): string[] {
  const context = body.findIndex((line) => /^#{3,4}\s*Context|^\*\*Context/.test(line.trim()));
  return [...(context === -1 ? body : body.slice(0, context))];
}

/** Long titles wrap, so a labelled title runs until the blank line after it. */
function joinFrom(lines: readonly string[], at: number, first: string): string {
  const rest: string[] = [];
  for (let i = at + 1; i < lines.length && lines[i]?.trim() !== ''; i += 1) {
    rest.push(lines[i]?.trim() ?? '');
  }
  return [first.trim(), ...rest].join(' ').trim();
}

/** `**Title:** x`, `### x`, or a lone bold line — the three shapes the log uses. */
function readTitle(body: readonly string[]): string {
  const lines = header(body);
  for (const [i, line] of lines.entries()) {
    const labelled = /^\*\*Title:\*\*\s*(.+)$/.exec(line);
    if (labelled?.[1] !== undefined) return joinFrom(lines, i, labelled[1]);
    const heading = /^#{3,4}\s+(.+)$/.exec(line);
    if (heading?.[1] !== undefined) return heading[1].trim();
    const bold = /^\*\*(.+?)\*\*$/.exec(line.trim());
    if (bold?.[1] !== undefined && !/^(Context|Date|Status|Track):?$/.test(bold[1])) {
      return joinFrom(lines, i, bold[1]);
    }
  }
  return '';
}

/**
 * Not anchored: ADR-099 writes `**Date:** … · **Status:** …` on one line.
 * Bounded to the header so the word never matches out of the Context prose.
 */
function readField(body: readonly string[], field: 'Date' | 'Status'): string {
  const pattern = new RegExp(`\\*{0,2}${field}:?\\*{0,2}:?\\s*(.+)$`);
  for (const line of header(body)) {
    const hit = pattern.exec(line.trim());
    if (hit?.[1] !== undefined) return hit[1].trim();
  }
  return '';
}

/**
 * The index is a table you scan, so the status is its first clause. The
 * amendment sentences that follow ` — ` or ` · ` belong to the ADR itself.
 */
function shorten(status: string): string {
  const [head = ''] = status.split(/\s+[—·]\s+/);
  return head.replace(/[.,]$/, '').trim();
}

export function parseLog(text: string): Adr[] {
  const lines = text.split('\n');
  const starts: { id: string; at: number }[] = [];
  lines.forEach((line, at) => {
    const hit = /^## ADR-(\d{3})\b/.exec(line);
    if (hit?.[1] !== undefined) starts.push({ id: hit[1], at });
  });

  return starts.map(({ id, at }, i) => {
    const body = lines.slice(at + 1, starts[i + 1]?.at ?? lines.length);
    const date = readField(body, 'Date');
    return {
      id,
      date: /(\d{4}-\d{2}-\d{2})/.exec(date)?.[1] ?? '',
      title: readTitle(body),
      // ADR-086 carries no Status line at all; an em dash says so rather than inventing one.
      status: shorten(readField(body, 'Status')) || '—',
    };
  });
}

export function renderIndex(adrs: readonly Adr[]): string {
  const rows = [...adrs]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      (a) =>
        `| [${a.id}](#adr-${a.id}) | ${a.date} | ${a.title.replaceAll('|', '\\|')} | ${a.status} |`,
    );
  return ['| ADR | Date | Title | Status |', '| --- | --- | --- | --- |', ...rows].join('\n');
}

/** Replaces the marked block, adding the markers around the existing table on first run. */
export function applyIndex(text: string, table: string): string {
  const block = `${OPEN}\n\n${table}\n\n${CLOSE}`;
  const start = text.indexOf(OPEN);
  if (start !== -1) {
    const end = text.indexOf(CLOSE, start);
    if (end === -1) throw new Error(`${LOG}: ${OPEN} has no ${CLOSE}`);
    return text.slice(0, start) + block + text.slice(end + CLOSE.length);
  }
  const heading = text.indexOf('## Index');
  if (heading === -1) throw new Error(`${LOG}: no "## Index" heading to place the table under`);
  const after = text.indexOf('\n---', heading);
  if (after === -1) throw new Error(`${LOG}: the Index section has no closing rule`);
  return `${text.slice(0, heading)}## Index\n\n${block}\n${text.slice(after)}`;
}

export function rebuild(root: string): { current: string; next: string } {
  const path = join(root, LOG);
  const current = readFileSync(path, 'utf8');
  return { current, next: applyIndex(current, renderIndex(parseLog(current))) };
}

function main(argv: readonly string[]): number {
  const root = join(fileURLToPath(import.meta.url), '../..');
  const { current, next } = rebuild(root);
  if (argv.includes('--check')) {
    if (current === next) return 0;
    process.stderr.write(`${LOG} index is stale — run pnpm adr:index\n`);
    return 1;
  }
  writeFileSync(join(root, LOG), next);
  process.stdout.write(`wrote the ${LOG} index\n`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main(process.argv.slice(2));
}
