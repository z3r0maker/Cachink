/**
 * Split a migration file into its top-level statements (DB2-MIG-01).
 *
 * A file marked `-- xangarro:no-transaction` cannot be sent as one string:
 * Postgres runs a multi-statement simple query as one implicit transaction,
 * which is exactly what `CREATE INDEX CONCURRENTLY` refuses. The runner sends
 * such a file one statement at a time, as `psql -f` does for `db-local.sh`.
 *
 * The scanner knows what can hide a `;`: single-quoted strings (with `''`,
 * and backslash escapes after `E`), quoted identifiers, dollar-quoted bodies
 * (`$$`, `$fn$`), line comments and nested block comments. Pure; unit-tested
 * in `tests/migrate-hosted-statements.test.ts`.
 */

interface Skip {
  /** Index just past the construct. */
  readonly next: number;
  /** Strings and identifiers are code; comments are not. */
  readonly code: boolean;
}

const IDENT = /[A-Za-z0-9_$]/;

function skipQuoted(src: string, i: number, quote: string, backslash: boolean): number {
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (backslash && c === '\\') j += 2;
    else if (c === quote && src[j + 1] === quote) j += 2;
    else if (c === quote) return j + 1;
    else j += 1;
  }
  return src.length;
}

function skipBlockComment(src: string, i: number): number {
  let depth = 0;
  let j = i;
  while (j < src.length) {
    const pair = src.slice(j, j + 2);
    if (pair === '/*') depth += 1;
    else if (pair === '*/') depth -= 1;
    j += pair === '/*' || pair === '*/' ? 2 : 1;
    if (depth === 0) return j;
  }
  return src.length;
}

function skipDollar(src: string, i: number): number | null {
  if (i > 0 && IDENT.test(src[i - 1] ?? '')) return null;
  const tag = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(src.slice(i))?.[0];
  if (tag === undefined) return null;
  const end = src.indexOf(tag, i + tag.length);
  return end === -1 ? src.length : end + tag.length;
}

function escapeString(src: string, i: number): boolean {
  const prev = src[i - 1] ?? '';
  return (prev === 'E' || prev === 'e') && !IDENT.test(src[i - 2] ?? '');
}

/** The construct starting at `i`, or null when `src[i]` is plain text. */
function skipAt(src: string, i: number): Skip | null {
  const c = src[i];
  if (c === "'") return { next: skipQuoted(src, i, "'", escapeString(src, i)), code: true };
  if (c === '"') return { next: skipQuoted(src, i, '"', false), code: true };
  if (c === '-' && src[i + 1] === '-') {
    const nl = src.indexOf('\n', i);
    return { next: nl === -1 ? src.length : nl + 1, code: false };
  }
  if (c === '/' && src[i + 1] === '*') return { next: skipBlockComment(src, i), code: false };
  if (c === '$') {
    const next = skipDollar(src, i);
    return next === null ? null : { next, code: true };
  }
  return null;
}

/** `src` with every comment replaced by a space; strings and bodies kept. */
export function withoutComments(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const skip = skipAt(src, i);
    if (skip === null) {
      out += src[i] ?? '';
      i += 1;
      continue;
    }
    out += skip.code ? src.slice(i, skip.next) : ' ';
    i = skip.next;
  }
  return out;
}

/**
 * The file's statements, in order, each without its terminating `;`.
 * Chunks holding only whitespace and comments are dropped.
 */
export function splitStatements(src: string): string[] {
  const out: string[] = [];
  let start = 0;
  let code = false;
  let i = 0;
  while (i < src.length) {
    const skip = skipAt(src, i);
    if (skip !== null) {
      code ||= skip.code;
      i = skip.next;
      continue;
    }
    const c = src[i] ?? '';
    if (c === ';') {
      if (code) out.push(src.slice(start, i).trim());
      start = i + 1;
      code = false;
    } else if (!/\s/.test(c)) code = true;
    i += 1;
  }
  if (code) out.push(src.slice(start).trim());
  return out;
}
