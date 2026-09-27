/**
 * Text Postgres cannot store (audit DB3-SYNC-01 a). A `text` column refuses the
 * NUL character (22021) and a `jsonb` one its `\u0000` escape (22P05); a lone
 * UTF-16 surrogate is not Unicode at all — the driver would silently turn it
 * into U+FFFD, and `jsonb` refuses its escape. One such character used to fail
 * a whole push forever, so the push refuses the row up front, and bookkeeping
 * cleans whatever it keeps.
 */

const NUL = '\u0000';
/** A high surrogate with no low one after it, or a low one with no high one before it. */
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const LONE_SURROGATES = new RegExp(LONE_SURROGATE.source, 'g');

const unstorable = (s: string): boolean => s.includes(NUL) || LONE_SURROGATE.test(s);

/** The path of the first string (value or key) in `value` Postgres cannot store, or null. */
export function unstorableText(value: unknown, path = ''): string | null {
  if (typeof value === 'string') return unstorable(value) ? path || '(value)' : null;
  if (value === null || typeof value !== 'object') return null;
  for (const [k, v] of Object.entries(value)) {
    const at = path === '' ? k : `${path}.${k}`;
    if (unstorable(k)) return at;
    const found = unstorableText(v, at);
    if (found !== null) return found;
  }
  return null;
}

/** A string Postgres can store: NUL dropped, a lone surrogate replaced by U+FFFD. */
export const storableString = (s: string): string =>
  s.replaceAll(NUL, '').replace(LONE_SURROGATES, '\uFFFD');

/** `value` with every string in it, keys included, made storable. */
export function storableText(value: unknown): unknown {
  if (typeof value === 'string') return storableString(value);
  if (Array.isArray(value)) return value.map(storableText);
  if (value === null || typeof value !== 'object' || value instanceof Date) return value;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [storableString(k), storableText(v)]),
  );
}
