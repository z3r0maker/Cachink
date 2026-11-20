/**
 * Bug candidates (spec §8.3 task 2): every console error and every failed
 * request in a run, picked by script before the judge sees it, so the judge
 * cannot overlook one. The judge then turns each into a finding or dismisses
 * it with a reason; `review.ts` holds it to that.
 */
export interface BugCandidate {
  readonly id: string;
  readonly source: 'console' | 'network';
  /** Where it is, as a finding cites it: `console.jsonl#L3`. */
  readonly ref: string;
  readonly text: string;
}

type Line = Record<string, unknown>;

function rows(text: string): (Line | undefined)[] {
  return text.split('\n').map((l) => {
    try {
      return JSON.parse(l) as Line;
    } catch {
      return undefined;
    }
  });
}

/** Web: `error` and `pageerror`. Phone (logcat): `E` and `F`. */
const CONSOLE_BUG = new Set(['error', 'pageerror', 'E', 'F']);

function consoleText(r: Line): string {
  return `${r.tag === undefined ? '' : `${String(r.tag)}: `}${String(r.text ?? '')}`;
}

/** A request that failed, answered 4xx/5xx, or had rows refused. A slow success is friction, not a bug. */
function networkBug(r: Line): boolean {
  return r.failure !== undefined || Number(r.status) >= 400 || Number(r.rejected ?? 0) > 0;
}

function networkText(r: Line): string {
  const what =
    r.endpoint === undefined ? `${String(r.method)} ${String(r.url)}` : String(r.endpoint);
  const how = r.failure === undefined ? `status ${String(r.status)}` : String(r.failure);
  const refused =
    Number(r.rejected ?? 0) > 0
      ? `, ${String(r.rejected)} rows refused ${JSON.stringify(r.codes ?? {})}`
      : '';
  return `${what}: ${how}${refused}`;
}

/** A stack frame, a cause, or an elided tail: the rest of the error above it. */
const CONTINUATION = /^(?:[\w.$-]+: )?\s*(?:at |\.\.\. \d+ more|Caused by:)/;

interface Group {
  readonly line: number;
  readonly tag: unknown;
  readonly text: string;
  last: number;
  extra: number;
}

/**
 * Console errors as candidates, one per error: a stack trace's frames, and the
 * same error repeated line after line, fold into the line that starts it, so
 * the judge answers one candidate per error, not one per logcat line.
 */
function consoleGroups(consoleJsonl: string): Group[] {
  const groups: Group[] = [];
  rows(consoleJsonl).forEach((r, i) => {
    if (r === undefined || !CONSOLE_BUG.has(String(r.type))) return;
    const text = String(r.text ?? '');
    const prev = groups.at(-1);
    const joins = prev !== undefined && prev.last === i - 1 && prev.tag === r.tag;
    if (joins && (CONTINUATION.test(text) || text === prev.text)) {
      prev.last = i;
      prev.extra += 1;
      return;
    }
    groups.push({ line: i + 1, tag: r.tag, text, last: i, extra: 0 });
  });
  return groups;
}

function groupText(g: Group): string {
  const base = consoleText({ tag: g.tag, text: g.text }).trimEnd();
  if (g.extra === 0) return base;
  return `${base} (y ${g.extra} ${g.extra === 1 ? 'línea más' : 'líneas más'})`;
}

export function bugCandidates(consoleJsonl: string, networkJsonl: string): BugCandidate[] {
  const found: Omit<BugCandidate, 'id'>[] = consoleGroups(consoleJsonl).map((g) => ({
    source: 'console',
    ref: `console.jsonl#L${g.line}`,
    text: groupText(g),
  }));
  rows(networkJsonl).forEach((r, i) => {
    if (r !== undefined && networkBug(r)) {
      found.push({ source: 'network', ref: `network.jsonl#L${i + 1}`, text: networkText(r) });
    }
  });
  return found.map((c, i) => ({ id: `C${i + 1}`, ...c }));
}
