/**
 * An uploaded SVG, tidied for the gate (N-19, audit F-01). An editor exports a
 * drawing wrapped in baggage the gate's allowlist refuses on sight: a
 * byte-order mark, an XML declaration, comments, a DOCTYPE, metadata. All of
 * it is inert, so it is dropped here rather than turning away an honest logo.
 *
 * This is not the security control and it repairs nothing hostile:
 * `svgIsSafe` is an allowlist over whatever comes out of here, and the caller
 * stores exactly the string the gate accepted. Every pass is linear. The lazy
 * regular expressions this replaces went quadratic on a file of unclosed
 * `<!--`, two megabytes of which is a stalled server.
 */

/** What an editor writes around a drawing: inert, and not on the allowlist. */
const EDITOR_ELEMENTS = [
  'metadata',
  'sodipodi:namedview',
  'inkscape:perspective',
  'inkscape:path-effect',
] as const;

/** U+FEFF, spelled by its number: an invisible character has no place in a source file. */
const BYTE_ORDER_MARK = String.fromCodePoint(0xfeff);

const escapeXml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/**
 * Every `open…close` span removed, or rewritten by `rewrite`. It stops at the
 * first span that never closes and leaves the rest for the gate to refuse.
 */
function dropSpans(
  source: string,
  open: string,
  close: string,
  rewrite: (inner: string) => string = () => '',
): string {
  let out = '';
  let at = 0;
  for (;;) {
    const start = source.indexOf(open, at);
    const end = start === -1 ? -1 : source.indexOf(close, start + open.length);
    if (end === -1) return out + source.slice(at);
    out += source.slice(at, start) + rewrite(source.slice(start + open.length, end));
    at = end + close.length;
  }
}

/** One element by name, self-closing or with everything inside it. */
function dropElement(source: string, name: string): string {
  const closeTag = `</${name}>`;
  let out = '';
  let at = 0;
  for (;;) {
    const start = source.indexOf(`<${name}`, at);
    const gt = start === -1 ? -1 : source.indexOf('>', start);
    if (gt === -1) return out + source.slice(at);
    const selfClosing = source[gt - 1] === '/';
    const close = selfClosing ? gt : source.indexOf(closeTag, gt);
    if (close === -1) return out + source.slice(at);
    out += source.slice(at, start);
    at = selfClosing ? gt + 1 : close + closeTag.length;
  }
}

export function sanitiseSvg(source: string): string {
  let svg = source.replaceAll(BYTE_ORDER_MARK, '');
  // A CDATA section is literal text: escaped, it is the same document.
  svg = dropSpans(svg, '<![CDATA[', ']]>', escapeXml);
  svg = dropSpans(svg, '<!--', '-->');
  svg = dropSpans(svg, '<?', '?>');
  // A DOCTYPE with an internal subset (`[<!ENTITY …>]`) is left for the gate.
  svg = svg.replace(/<!DOCTYPE[^<>[\]]*>/gi, '');
  for (const name of EDITOR_ELEMENTS) svg = dropElement(svg, name);
  return svg.trim();
}
