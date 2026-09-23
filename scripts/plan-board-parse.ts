/**
 * Parser behind `docs/plan/PENDIENTES.md` (see `plan-board.ts`).
 *
 * Status lives in the track files as the checkbox lines `00-README.md` §3
 * defines. This reads them — nothing else — so the board can never disagree
 * with the file a session actually edits. Three shapes exist in the tracks:
 *
 *   1. `### N-01 Title` followed by `- [~] Status · **Blocked by:** …`
 *   2. `- [x] **N-55 · Title.** …` (the geo phases, one line each)
 *   3. `- [ ] Any sentence` (production-readiness, no id)
 *
 * A continuation line `**Remaining (date, …):** …` under a Status line is
 * what a verification pass found still missing; the board prints it.
 *
 * plus the owner-action tables in `11-pre-launch-and-deferred.md`
 * (`| O-1 | title | …`, done when the row says `**Done`).
 */

export type Status = 'open' | 'progress' | 'blocked' | 'done';

export interface Item {
  readonly source: string;
  readonly line: number;
  readonly id: string | null;
  readonly title: string;
  readonly status: Status;
  readonly section: string;
  readonly trigger: string | null;
  readonly blockedBy: string | null;
  /** The `**Remaining (…):**` note a verification pass left under the Status line. */
  readonly remaining: string | null;
}

const MARKS: Readonly<Record<string, Status>> = {
  ' ': 'open',
  '~': 'progress',
  '!': 'blocked',
  x: 'done',
};

const TASK = /^\s*- \[([ x~!])\] (.*)$/;
const H2 = /^## (.*)$/;
const H3 = /^### ([A-Z]{1,2}-\d+)\s+(.*)$/;
const INLINE = /^\*\*([A-Z]{1,2}-\d+) · ([^*]*?)\*\*/;
const OWNER_ROW = /^\| (O-\d+)\s*\|([^|]*)\|/;
const NESTED = /^\s{2,}\S/;
const TITLE_MAX = 110;

/** `name` is a regex fragment, so a dated label like `Remaining (2026-09-23)` still matches. */
function field(text: string, name: string): string | null {
  // Stops at the next bold field (`· **Blocks:**` or a bare `**Blocked by:**` on a continuation line).
  const m = new RegExp(
    `\\*\\*${name}:\\*\\*\\s*(.*?)(?=\\s*(?:·\\s*)?\\*\\*[A-Z][^*]*:\\*\\*|$)`,
  ).exec(text);
  return m?.[1]?.trim() || null;
}

function clean(text: string): string {
  const t = text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  return t.length > TITLE_MAX ? `${t.slice(0, TITLE_MAX - 1)}…` : t;
}

interface Cursor {
  section: string;
  heading: { id: string; title: string } | null;
}

function fromTaskLine(
  cursor: Cursor,
  mark: string,
  text: string,
  note: string,
): Omit<Item, 'source' | 'line'> {
  const status = MARKS[mark] ?? 'open';
  const inline = INLINE.exec(text);
  const head = text.startsWith('Status') ? cursor.heading : null;
  const id = inline?.[1] ?? head?.id ?? null;
  const title = inline ? clean(inline[2] ?? '') : head ? clean(head.title) : clean(text);
  return {
    id,
    title,
    status,
    section: cursor.section,
    trigger: field(note, 'Trigger'),
    blockedBy: field(note, 'Blocked by'),
    remaining: field(note, 'Remaining(?: \\([^)]*\\))?'),
  };
}

/** The Status line plus everything indented under it (continuation lines and nested bullets). */
function gatherNote(lines: readonly string[], from: number): string {
  let note = lines[from] ?? '';
  for (let i = from + 1; i < lines.length; i += 1) {
    const ln = lines[i] ?? '';
    if (ln.trim() === '') {
      if (!NESTED.test(lines[i + 1] ?? '')) break;
      continue;
    }
    if (!NESTED.test(ln)) break;
    note += ` ${ln.trim().replace(/^- /, '')}`;
  }
  return note;
}

/** Every item in one file, done ones included; `source` is the label the board prints. */
export function parseTrack(source: string, content: string): Item[] {
  const lines = content.split('\n');
  const cursor: Cursor = { section: '', heading: null };
  const items: Item[] = [];
  lines.forEach((ln, idx) => {
    const h2 = H2.exec(ln);
    if (h2) {
      cursor.section = clean(h2[1] ?? '');
      cursor.heading = null;
      return;
    }
    const h3 = H3.exec(ln);
    if (h3) cursor.heading = { id: h3[1] ?? '', title: h3[2] ?? '' };
    const row = OWNER_ROW.exec(ln);
    if (row) {
      items.push(ownerRow(source, idx + 1, cursor.section, row, ln));
      return;
    }
    const task = TASK.exec(ln);
    if (!task) return;
    const parsed = fromTaskLine(cursor, task[1] ?? ' ', task[2] ?? '', gatherNote(lines, idx));
    items.push({ source, line: idx + 1, ...parsed });
  });
  return items;
}

function ownerRow(
  source: string,
  line: number,
  section: string,
  row: RegExpExecArray,
  raw: string,
): Item {
  return {
    source,
    line,
    id: row[1] ?? null,
    title: clean(row[2] ?? ''),
    status: raw.includes('**Done') ? 'done' : 'open',
    section,
    trigger: null,
    blockedBy: null,
    remaining: null,
  };
}
