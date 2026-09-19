/**
 * A deliberately small CSV reader for the import templates (N-16: .xlsx and
 * .csv). RFC-4180 enough for spreadsheets' export output: double-quoted
 * fields, "" escapes, CRLF or LF rows, a leading UTF-8 BOM. Numbers stay
 * strings — `pesosToCentavos` parses text, same as an ExcelJS cell's.
 */
interface Scan {
  src: string;
  i: number;
  field: string;
  quoted: boolean;
}

/** A quoted field's content, "" included, until the closing quote. */
function scanQuoted(s: Scan): void {
  const ch = s.src[s.i];
  if (ch === '"') {
    if (s.src[s.i + 1] === '"') {
      s.field += '"';
      s.i += 1;
    } else {
      s.quoted = false;
    }
  } else {
    s.field += ch;
  }
}

/** An unquoted field's content up to the next separator or row end. */
function scanBare(s: Scan, ch: string, endField: () => void, endRow: () => void): void {
  if (ch === ',') endField();
  else if (ch === '\r' || ch === '\n') {
    if (ch === '\r' && s.src[s.i + 1] === '\n') s.i += 1;
    endRow();
  } else {
    s.field += ch;
  }
}

export function parseCsv(text: string): unknown[][] {
  const rows: unknown[][] = [];
  let row: string[] = [];
  const s: Scan = { src: text.replace(/^\uFEFF/, ''), i: 0, field: '', quoted: false };

  const endField = () => {
    row.push(s.field);
    s.field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (s.i < s.src.length) {
    const ch = s.src[s.i] as string;
    if (s.quoted) {
      scanQuoted(s);
    } else if (ch === '"' && s.field === '') {
      s.quoted = true;
    } else {
      scanBare(s, ch, endField, endRow);
    }
    s.i += 1;
  }
  if (s.field !== '' || row.length > 0 || s.quoted) endRow();
  return rows;
}
