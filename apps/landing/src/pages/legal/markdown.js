/**
 * The subset of Markdown the legal drafts in docs/legal/aviso use, parsed into
 * blocks (N-34): headings, paragraphs, lists, tables. Blockquotes are
 * dropped: in those drafts they are the draft banner and the notes for
 * counsel, which the drafts themselves say are removed before publishing.
 */

const HEADING = /^(#{1,4})\s+(.*)$/;
const ITEM = /^(?:-|\d+\.)\s+(.*)$/;

function kindOf(line) {
  if (HEADING.test(line)) return 'heading';
  if (line.startsWith('>')) return 'quote';
  if (line.startsWith('|')) return 'table';
  if (ITEM.test(line)) return 'list';
  return 'paragraph';
}

function cells(row) {
  return row
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function tableOf(lines) {
  const rows = lines.filter((l) => !/^\|\s*:?-{3,}/.test(l)).map(cells);
  return { type: 'table', head: rows[0] ?? [], rows: rows.slice(1) };
}

function listOf(lines) {
  const items = [];
  for (const line of lines) {
    const m = ITEM.exec(line);
    if (m) items.push(m[1]);
    else if (items.length > 0) items[items.length - 1] += ` ${line.trim()}`;
  }
  return { type: /^\d+\./.test(lines[0]) ? 'ol' : 'ul', items };
}

function blockOf(lines) {
  const first = lines[0];
  const kind = kindOf(first);
  if (kind === 'quote' || first.trim() === '---') return null;
  if (kind === 'heading') {
    const m = HEADING.exec(first);
    return { type: 'heading', level: m[1].length, text: m[2] };
  }
  if (kind === 'table') return tableOf(lines);
  if (kind === 'list') return listOf(lines);
  return { type: 'p', text: lines.map((l) => l.trim()).join(' ') };
}

/** Group lines into blocks: a blank line, a heading or a new kind starts one. */
function groups(source) {
  const out = [];
  let current = [];
  const flush = () => {
    if (current.length > 0) out.push(current);
    current = [];
  };
  for (const line of source.split('\n')) {
    if (line.trim() === '') flush();
    else if (HEADING.test(line)) {
      flush();
      out.push([line]);
    } else {
      const indented = /^\s+\S/.test(line);
      const prev = current[0];
      if (prev && !indented && kindOf(line) !== kindOf(prev) && kindOf(line) !== 'paragraph') {
        flush();
      }
      current.push(line);
    }
  }
  flush();
  return out;
}

export function parseLegalMarkdown(source) {
  return groups(source).map(blockOf).filter(Boolean);
}
