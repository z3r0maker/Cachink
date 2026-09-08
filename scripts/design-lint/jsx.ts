/**
 * jsx.ts — minimal, brace-aware JSX source utilities for the design linter.
 *
 * Why not a regex: Tamagui call sites nest elements inside props
 * (`icon={<Icon name="trash-2" />}`). A naive `/<Btn[\s\S]*?\/>/` match
 * terminates at the *inner* `/>` and misreports a Btn that has children as
 * self-closing. Every rule in `scan.ts` depends on knowing whether a tag is
 * self-closing, so the open tag is parsed by tracking brace depth and string
 * state instead. During development this single distinction accounted for 22
 * of 24 false positives.
 *
 * Comments are blanked rather than deleted so byte offsets — and therefore
 * reported line numbers — stay aligned with the original file.
 */

/** A parsed JSX opening tag. */
export interface JsxTag {
  /** Element name, e.g. `Pressable`. */
  readonly name: string;
  /** Raw attribute source between the name and the closing `>`. */
  readonly attrs: string;
  /** Index of the tag's closing `>`. */
  readonly end: number;
  /** True when the tag closes itself (`<Btn ... />`). */
  readonly selfClosing: boolean;
}

/**
 * Replace comment bodies with spaces, preserving newlines and total length.
 * Keeps `<Pressable>` mentions inside JSDoc from being parsed as real JSX.
 */
export function blankComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^[ \t]*\/\/.*$/gm, (m) => ' '.repeat(m.length));
}

/** Read the element name that follows a `<`, returning it and where it ends. */
function readName(source: string, start: number): { name: string; next: number } {
  let i = start;
  let name = '';
  while (i < source.length && /[A-Za-z0-9_.]/.test(source[i] ?? '')) {
    name += source[i];
    i += 1;
  }
  return { name, next: i };
}

/** Running quote/brace state while scanning an attribute list. */
interface ScanState {
  depth: number;
  quote: string | null;
}

/**
 * Advance one character of attribute-list state.
 * Returns true when this character closes the opening tag at depth 0.
 */
function step(source: string, i: number, state: ScanState): boolean {
  const ch = source[i] ?? '';
  if (state.quote !== null) {
    if (ch === state.quote && source[i - 1] !== '\\') state.quote = null;
    return false;
  }
  if (ch === '"' || ch === "'" || ch === '`') state.quote = ch;
  else if (ch === '{') state.depth += 1;
  else if (ch === '}') state.depth -= 1;
  else if (state.depth === 0 && ch === '>') return true;
  return false;
}

/**
 * Parse the JSX opening tag beginning at `start` (which must index a `<`).
 * Returns `null` when the tag is unterminated.
 */
export function parseTag(source: string, start: number): JsxTag | null {
  const { name, next: attrStart } = readName(source, start + 1);
  const state: ScanState = { depth: 0, quote: null };

  for (let i = attrStart; i < source.length; i += 1) {
    if (!step(source, i, state)) continue;
    const selfClosing = source[i - 1] === '/';
    return {
      name,
      attrs: source.slice(attrStart, selfClosing ? i - 1 : i),
      end: i,
      selfClosing,
    };
  }
  return null;
}

/**
 * Return the source between an opening tag ending at `openEnd` and its
 * matching `</name>`, accounting for same-name nesting.
 */
export function childrenOf(source: string, name: string, openEnd: number): string {
  const close = `</${name}`;
  const open = `<${name}`;
  let depth = 1;
  let i = openEnd + 1;

  while (i < source.length) {
    if (source.startsWith(close, i)) {
      depth -= 1;
      if (depth === 0) return source.slice(openEnd + 1, i);
      i += close.length;
      continue;
    }
    if (source.startsWith(open, i) && /[\s>/]/.test(source[i + open.length] ?? '')) {
      depth += 1;
    }
    i += 1;
  }
  return source.slice(openEnd + 1);
}

/** 1-based line number for a byte offset. */
export function lineAt(source: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < source.length; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}

/** Iterate every JSX opening tag with a capitalised (component) name. */
export function* eachComponentTag(source: string): Generator<{ tag: JsxTag; start: number }> {
  for (let p = 0; p < source.length; p += 1) {
    if (source[p] !== '<') continue;
    if (!/[A-Z]/.test(source[p + 1] ?? '')) continue;
    const tag = parseTag(source, p);
    if (tag !== null) yield { tag, start: p };
  }
}
