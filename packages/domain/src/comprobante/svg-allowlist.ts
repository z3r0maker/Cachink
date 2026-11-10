/**
 * The upload gate for an SVG logo (audit F-01). An allowlist, so it fails
 * closed: the file is read as the XML a browser will parse, token by token,
 * and one token this module does not know refuses the whole file. Nothing is
 * repaired here. What a blacklist missed (`<x:script>` under a prefix bound
 * to the SVG namespace, `java&#115;cript:`) is refused for being unknown, not
 * for being recognised.
 *
 * Whitespace is XML's four characters, never `\s`: a character JavaScript
 * calls a space and XML does not would otherwise split a name differently
 * here than in the browser.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Presentational SVG only: nothing that scripts, animates, embeds or links out. */
const ELEMENTS: ReadonlySet<string> = new Set([
  ...['svg', 'g', 'defs', 'symbol', 'use', 'switch', 'title', 'desc', 'metadata', 'style'],
  ...['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'],
  ...['text', 'tspan', 'textPath'],
  ...['linearGradient', 'radialGradient', 'stop', 'pattern', 'clipPath', 'mask', 'marker'],
  ...['filter', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite'],
  ...['feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight'],
  ...['feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR'],
  ...['feGaussianBlur', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset'],
  ...['fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence'],
]);

/** `<name`: the name runs to the first character that cannot be part of one. */
const OPEN = /<([^ \t\r\n<>"'=/!?]+)/y;
/** One ` name="value"`. A value holds no `<`, as XML requires. */
const ATTRIBUTE = /[ \t\r\n]+([A-Za-z_:][-\w.:]*)[ \t\r\n]*=[ \t\r\n]*(?:"([^"<]*)"|'([^'<]*)')/y;
const TAG_END = /[ \t\r\n]*(\/?)>/y;
const CLOSE = /<\/([^ \t\r\n<>"'=/]+)[ \t\r\n]*>/y;

/** A reference that is not one of XML's five predefined entities. */
const FOREIGN_REFERENCE = /&(?!(?:amp|lt|gt|quot|apos);)/;
const ONLY_XML_SPACE = /^[ \t\r\n]*$/;
const FRAGMENT = /^#[^\s#]+$/;
/** `url(` that does not open on a same-document `#fragment`. */
const EXTERNAL_URL = /url\((?!["']?#)/;
/** What a stylesheet may not carry; the backslash is how CSS spells any of them in escapes. */
const CSS_REFUSED = ['\\', '@import', 'expression(', 'image-set('] as const;

/** Lower case, spaces out: `java\tscript:` and `url ( x` are read as a browser reads them. */
const squash = (value: string): string => value.toLowerCase().replace(/[ \t\r\n]+/g, '');

/** A squashed value that scripts, or reaches outside the document. */
const linksOut = (squashed: string): boolean =>
  squashed.includes('javascript:') || EXTERNAL_URL.test(squashed);

const valueIsSafe = (value: string): boolean => !linksOut(squash(value));

function cssIsSafe(css: string): boolean {
  const v = squash(css);
  return !linksOut(v) && !CSS_REFUSED.some((token) => v.includes(token));
}

function attributeIsSafe(rawName: string, value: string): boolean {
  if (FOREIGN_REFERENCE.test(value)) return false;
  const name = rawName.toLowerCase();
  if (name === 'xmlns') return value === SVG_NS;
  // A prefix declaration binds nothing this gate accepts: prefixed elements
  // are refused, and a prefixed attribute is judged by its local name.
  if (name.startsWith('xmlns:')) return valueIsSafe(value);
  const local = name.slice(name.lastIndexOf(':') + 1);
  if (local.startsWith('on') || local === 'base') return false;
  if (local === 'href') return FRAGMENT.test(value);
  if (local === 'style') return cssIsSafe(value);
  return valueIsSafe(value);
}

/** Control characters XML forbids, and the BOM: none belongs in a stored logo. */
function hasForbiddenCharacter(svg: string): boolean {
  for (let i = 0; i < svg.length; i += 1) {
    const c = svg.charCodeAt(i);
    if (c === 0xfeff || c === 0x7f) return true;
    if (c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) return true;
  }
  return false;
}

interface Walk {
  /** Open elements, innermost last. */
  readonly stack: string[];
  /** The root element has closed: nothing but space may follow. */
  done: boolean;
}

const innermost = (walk: Walk): string | undefined => walk.stack[walk.stack.length - 1];

function textIsSafe(text: string, walk: Walk): boolean {
  if (walk.stack.length === 0) return ONLY_XML_SPACE.test(text);
  if (FOREIGN_REFERENCE.test(text)) return false;
  return innermost(walk) === 'style' ? cssIsSafe(text) : true;
}

/** The index after the attributes of the tag that starts at `from`, or -1. */
function readAttributes(svg: string, from: number): number {
  let at = from;
  for (;;) {
    ATTRIBUTE.lastIndex = at;
    const found = ATTRIBUTE.exec(svg);
    if (found === null) return at;
    if (!attributeIsSafe(found[1] ?? '', found[2] ?? found[3] ?? '')) return -1;
    at = ATTRIBUTE.lastIndex;
  }
}

function mayOpen(name: string, walk: Walk): boolean {
  if (walk.done || !ELEMENTS.has(name)) return false;
  if (walk.stack.length === 0) return name === 'svg';
  // A stylesheet is text: an element inside it would hide text from the check.
  return innermost(walk) !== 'style';
}

/** The index after the start tag at `lt`, or -1 when the tag is refused. */
function readOpenTag(svg: string, lt: number, walk: Walk): number {
  OPEN.lastIndex = lt;
  const name = OPEN.exec(svg)?.[1];
  if (name === undefined || !mayOpen(name, walk)) return -1;
  const afterAttributes = readAttributes(svg, OPEN.lastIndex);
  if (afterAttributes === -1) return -1;
  TAG_END.lastIndex = afterAttributes;
  const end = TAG_END.exec(svg);
  if (end === null) return -1;
  if (end[1] !== '/') walk.stack.push(name);
  else if (walk.stack.length === 0) walk.done = true;
  return TAG_END.lastIndex;
}

/** The index after the end tag at `lt`, or -1 when it closes the wrong element. */
function readCloseTag(svg: string, lt: number, walk: Walk): number {
  CLOSE.lastIndex = lt;
  const name = CLOSE.exec(svg)?.[1];
  if (name === undefined || walk.stack.pop() !== name) return -1;
  if (walk.stack.length === 0) walk.done = true;
  return CLOSE.lastIndex;
}

/**
 * True when the file is one `<svg>` element of allowlisted elements, with no
 * handler, no reference out of the document, no entity beyond XML's five, and
 * no DOCTYPE, CDATA, comment or processing instruction. Linear in the input.
 */
export function svgIsSafe(svg: string): boolean {
  if (hasForbiddenCharacter(svg)) return false;
  const walk: Walk = { stack: [], done: false };
  let at = 0;
  while (at !== -1 && at < svg.length) at = readNext(svg, at, walk);
  return at !== -1 && walk.done && walk.stack.length === 0;
}

/** The text from `at` and the tag that ends it: the index after both, or -1. */
function readNext(svg: string, at: number, walk: Walk): number {
  const lt = svg.indexOf('<', at);
  const text = svg.slice(at, lt === -1 ? svg.length : lt);
  if (!textIsSafe(text, walk)) return -1;
  if (lt === -1) return svg.length;
  return svg[lt + 1] === '/' ? readCloseTag(svg, lt, walk) : readOpenTag(svg, lt, walk);
}
