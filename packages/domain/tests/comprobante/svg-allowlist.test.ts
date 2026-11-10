import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { sanitiseSvg, svgIsSafe } from '../../src/comprobante/index.js';

/**
 * The upload gate fails closed (audit F-01): an SVG is stored only when every
 * token in it is on the allowlist. The hostile corpus is what a blacklist
 * misses; the honest corpus is what a real logo looks like.
 */
const NS = 'xmlns="http://www.w3.org/2000/svg"';
const XLINK = 'xmlns:xlink="http://www.w3.org/1999/xlink"';
const wrap = (inner: string, attrs = '') => `<svg ${NS}${attrs}>${inner}</svg>`;
/** U+FEFF by its number, so no invisible character sits in this file. */
const BYTE_ORDER_MARK = String.fromCodePoint(0xfeff);

const HOSTILE: Readonly<Record<string, string>> = {
  'a script under a prefix bound to the SVG namespace': `<svg ${NS} xmlns:x="http://www.w3.org/2000/svg"><x:script>alert(1)</x:script></svg>`,
  'a javascript: href hidden in a character reference': wrap(
    '<a href="java&#115;cript:alert(1)"><text>hi</text></a>',
  ),
  'svg:script': `<svg:svg xmlns:svg="http://www.w3.org/2000/svg"><svg:script>alert(1)</svg:script></svg:svg>`,
  'a plain script': wrap('<script>alert(1)</script>'),
  'a CDATA-wrapped script': wrap('<script><![CDATA[alert(1)]]></script>'),
  'a bare CDATA section': wrap('<text><![CDATA[<script>alert(1)</script>]]></text>'),
  foreignObject: wrap(
    '<foreignObject width="9" height="9"><body xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="alert(1)"/></body></foreignObject>',
  ),
  'animate that rewrites an href': wrap(
    '<a id="l"><text>x</text><animate attributeName="href" values="javascript:alert(1)" begin="0s"/></a>',
  ),
  'set that rewrites an attribute': wrap(
    '<rect width="9" height="9"><set attributeName="onmouseover" to="alert(1)"/></rect>',
  ),
  'use of an external document': wrap('<use href="http://evil.example/x.svg#p"/>'),
  'use through xlink to an external document': wrap(
    '<use xlink:href="//evil.example/x.svg#p"/>',
    ` ${XLINK}`,
  ),
  'an image that is an SVG data URL': wrap(
    '<image href="data:image/svg+xml,%3Csvg onload=alert(1)%3E" width="9" height="9"/>',
  ),
  'a handler with a tab before the equals sign': wrap('<rect width="9" onload\t=\t"alert(1)"/>'),
  'a handler on its own line': wrap('<rect width="9"\nonclick\n=\n"alert(1)"/>'),
  'a handler in single quotes': wrap("<rect width='9' onfocus='alert(1)'/>"),
  'a mixed-case handler': wrap('<rect width="9" OnLoAd="alert(1)"/>'),
  'a mixed-case script': wrap('<ScRiPt>alert(1)</ScRiPt>'),
  'an upper-case root': '<SVG xmlns="http://www.w3.org/2000/svg"><SCRIPT>alert(1)</SCRIPT></SVG>',
  'a handler on the root': wrap('<circle r="9"/>', ' onload="alert(1)"'),
  'a handler under a prefix': wrap('<rect width="9" x:onload="alert(1)"/>', ' xmlns:x="urn:x"'),
  'an href under a made-up xlink prefix': wrap(
    '<use q:href="https://evil.example/x.svg#p"/>',
    ' xmlns:q="http://www.w3.org/1999/xlink"',
  ),
  'a DOCTYPE with an entity': `<!DOCTYPE svg [<!ENTITY x "<script>alert(1)</script>">]>${wrap('<text>&x;</text>')}`,
  'an undeclared entity reference': wrap('<text>&xxe;</text>'),
  'a decimal character reference': wrap('<text>&#60;script&#62;</text>'),
  'a hex character reference in an attribute': wrap('<rect width="9" fill="&#x23;fff"/>'),
  'a processing instruction': `<?xml-stylesheet href="http://evil.example/x.css"?>${wrap('<circle r="9"/>')}`,
  'a processing instruction inside the root': wrap('<?evil x?><circle r="9"/>'),
  '@import in a style element': wrap('<style>@import url(http://evil.example/x.css);</style>'),
  'an external url() in a style element': wrap(
    '<style>.a{fill:url(http://evil.example/p.svg#g)}</style><rect class="a" width="9"/>',
  ),
  'an external url() in a style attribute': wrap(
    '<rect width="9" style="fill:url( \'https://evil.example/p.svg#g\' )"/>',
  ),
  'an external url() in a presentation attribute': wrap(
    '<rect width="9" fill="url(https://evil.example/p.svg#g)"/>',
  ),
  'expression() in a style attribute': wrap('<rect width="9" style="width:expression(alert(1))"/>'),
  'javascript: in a style attribute': wrap(
    '<rect width="9" style="background:javascript:alert(1)"/>',
  ),
  'a CSS escape that spells url(': wrap(
    '<style>.a{fill:\\75rl(http://evil.example/p.svg#g)}</style>',
  ),
  'an element inside a style element': wrap('<style><g>@import "x.css";</g></style>'),
  iframe: wrap('<iframe src="https://evil.example"/>'),
  'an unknown element': wrap('<blink>hi</blink>'),
  'a foreign default namespace': '<svg xmlns="http://www.w3.org/1999/xhtml"><title>x</title></svg>',
  'xml:base': wrap('<use href="#a"/>', ' xml:base="https://evil.example/"'),
  'text before the root': `alert(1)${wrap('<circle r="9"/>')}`,
  'a second root': `${wrap('<circle r="9"/>')}<script>alert(1)</script>`,
  'an unclosed tag': wrap('<g><circle r="9"/>'),
  'a mismatched close tag': wrap('<g><circle r="9"/></defs>'),
  'an unquoted attribute': wrap('<rect width=9 onload=alert(1) />'),
  'a root that is not svg': '<html><body>hola</body></html>',
  'an empty file': '',
  'a NUL byte in a tag name': wrap('<scr\u0000ipt>alert(1)</scr\u0000ipt>'),
};

const HONEST: Readonly<Record<string, string>> = {
  'a single path': wrap('<path fill="#d4a017" d="M4 4h16v16H4z"/>', ' viewBox="0 0 24 24"'),
  'groups, shapes and transforms': wrap(
    '<g id="marca" transform="translate(2 2)" opacity=".9"><rect x="1" y="1" width="10" height="10" rx="2" fill="#0a7dbd"/>' +
      '<circle cx="6" cy="6" r="3" fill="none" stroke="#fff" stroke-width="1.5"/>' +
      '<polygon points="0,0 4,0 2,3"/><ellipse cx="3" cy="3" rx="2" ry="1"/><line x1="0" y1="0" x2="9" y2="9" stroke="#000"/></g>',
    ' width="48" height="48" viewBox="0 0 24 24"',
  ),
  'a gradient referenced by url(#id)': wrap(
    '<defs><linearGradient id="g1" x1="0" x2="1"><stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#00f"/></linearGradient></defs>' +
      '<rect width="24" height="24" fill="url(#g1)"/>',
  ),
  'a gradient that inherits through xlink:href': wrap(
    '<defs><linearGradient id="base"><stop offset="0" stop-color="#f00"/></linearGradient>' +
      '<radialGradient id="g2" xlink:href="#base" cx="12" cy="12" r="12"/></defs>' +
      '<circle cx="12" cy="12" r="12" style="fill:url(#g2);stroke:none"/>',
    ` ${XLINK}`,
  ),
  'a style element with class fills': wrap(
    '<style type="text/css">.st0{fill:#E31E24;} .st1 { fill: #1d1d1b; stroke-width: 2px }</style>' +
      '<path class="st0" d="M0 0h9v9H0z"/><path class="st1" d="M9 9h9v9H9z"/>',
  ),
  'a title and a description': wrap(
    '<title>Tortillería La Güera</title><desc>Logo &amp; marca, 2026 &lt;oficial&gt;</desc><circle r="9"/>',
  ),
  'text set in a font': wrap(
    '<text x="2" y="14" font-family="Arial, sans-serif" font-size="12" fill="#111">La <tspan font-weight="700">Güera</tspan></text>',
  ),
  'a clip path and a mask': wrap(
    '<defs><clipPath id="c"><rect width="10" height="10"/></clipPath><mask id="m"><rect width="10" height="10" fill="#fff"/></mask></defs>' +
      '<g clip-path="url(#c)" mask="url(#m)"><path d="M0 0L10 10"/></g>',
  ),
  'a symbol reused in the same document': wrap(
    '<defs><symbol id="hoja" viewBox="0 0 4 4"><path d="M0 0h4v4z"/></symbol></defs>' +
      '<use href="#hoja" x="1" y="1" width="8" height="8"/><use xlink:href="#hoja" x="9"/>',
    ` ${XLINK}`,
  ),
  'a drop shadow filter': wrap(
    '<defs><filter id="f"><feGaussianBlur stdDeviation="2"/><feOffset dx="1" dy="1"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<rect width="9" height="9" filter="url(#f)"/>',
  ),
  'editor attributes under their own prefixes': wrap(
    '<g inkscape:label="Capa 1" inkscape:groupmode="layer"><path d="M0 0h9" sodipodi:nodetypes="cc"/></g>',
    ' xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" version="1.1" xml:space="preserve"',
  ),
  'single-quoted attributes and line breaks': `<svg ${NS}\n  viewBox='0 0 24 24'\n>\n  <path d='M4 4h16'\n    stroke='#333' />\n</svg>`,
};

describe('svgIsSafe (audit F-01: the gate is an allowlist)', () => {
  for (const [name, svg] of Object.entries(HOSTILE)) {
    it(`refuses ${name}`, () => {
      assert.equal(svgIsSafe(svg), false);
    });
  }

  for (const [name, svg] of Object.entries(HONEST)) {
    it(`accepts ${name}`, () => {
      assert.equal(svgIsSafe(svg), true);
    });
  }

  it('stays linear on a pathological input', () => {
    const big = wrap(`<g ${'a="b" '.repeat(50_000)}`);
    const started = Date.now();
    assert.equal(svgIsSafe(big), false);
    assert.ok(Date.now() - started < 1000, 'the tokeniser must not backtrack');
  });

  it('skips a long run of whitespace once, wherever a tag may hold one', () => {
    const tabs = '\t'.repeat(1_000_000);
    const started = Date.now();
    // Before a tag's end, around an equals sign, and before an end tag's `>`.
    const roomy = `<svg ${NS}${tabs}><g id${tabs}=${tabs}"a"${tabs}/></svg${tabs}>`;
    assert.equal(svgIsSafe(roomy), true);
    // The same runs in front of what no tag may hold.
    assert.equal(svgIsSafe(`<svg ${NS}${tabs}!></svg>`), false);
    assert.equal(svgIsSafe(wrap(`<g${tabs}id${tabs}"a"/>`)), false);
    assert.equal(svgIsSafe(wrap(`<g${tabs}id=${tabs}a/>`)), false);
    assert.equal(svgIsSafe(wrap(`<g></g${tabs}x>`)), false);
    assert.ok(Date.now() - started < 1000, 'whitespace must not be scanned again and again');
  });
});

describe('sanitiseSvg then svgIsSafe (what the upload stores)', () => {
  // A payload is live inside a tag or a stylesheet; as escaped text it is ink.
  const LIVE = /<[^<>]*(?:alert|evil\.example|javascript|onload|onerror|script|import)/i;

  for (const [name, svg] of Object.entries(HOSTILE)) {
    it(`never stores the payload of ${name}`, () => {
      const clean = sanitiseSvg(svg);
      if (!svgIsSafe(clean)) return;
      assert.doesNotMatch(clean, LIVE);
      assert.doesNotMatch(clean, /<style/, 'no hostile stylesheet is repaired into a stored one');
    });
  }

  it('refuses a byte-order mark the tidy did not see, wherever it sits', () => {
    assert.equal(svgIsSafe(`${BYTE_ORDER_MARK}${wrap('<circle r="9"/>')}`), false);
    assert.equal(svgIsSafe(wrap(`<g${BYTE_ORDER_MARK}><circle r="9"/></g>`)), false);
  });

  it('tidies two megabytes of unclosed comments in linear time', () => {
    // The lazy `<!--[\s\S]*?-->` this replaces rescanned the file from every `<!--`.
    const big = `<svg ${NS}>${'<!--'.repeat(500_000)}`;
    const started = Date.now();
    assert.equal(svgIsSafe(sanitiseSvg(big)), false);
    assert.ok(Date.now() - started < 2000, 'no pass may rescan from every opening');
  });

  it('turns markup inside CDATA into text that draws as letters', () => {
    const clean = sanitiseSvg(wrap('<text><![CDATA[<script>alert(1)</script>]]></text>'));
    assert.equal(clean, wrap('<text>&lt;script&gt;alert(1)&lt;/script&gt;</text>'));
    assert.equal(svgIsSafe(clean), true);
  });

  for (const [name, svg] of Object.entries(HONEST)) {
    it(`leaves ${name} as it was drawn`, () => {
      assert.equal(sanitiseSvg(svg), svg);
    });
  }

  it('drops what an editor writes around the drawing, and the result passes', () => {
    const exported =
      `${BYTE_ORDER_MARK}<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n` +
      '<!-- Generator: Adobe Illustrator 27.0 -->\n' +
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
      `<svg ${NS} xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" viewBox="0 0 9 9">` +
      '<sodipodi:namedview id="base" pagecolor="#ffffff"><inkscape:grid type="xygrid"/></sodipodi:namedview>' +
      '<metadata><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format></cc:Work></rdf:RDF></metadata>' +
      '<path d="M0 0h9" fill="#d4a017"/></svg>';
    const clean = sanitiseSvg(exported);
    assert.equal(svgIsSafe(exported), false, 'the gate alone refuses the raw export');
    assert.equal(svgIsSafe(clean), true);
    assert.equal(
      clean,
      `<svg ${NS} xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" viewBox="0 0 9 9"><path d="M0 0h9" fill="#d4a017"/></svg>`,
    );
  });

  it('turns a CDATA stylesheet into the same text, escaped', () => {
    const corel = wrap(
      '<style type="text/css"><![CDATA[.fil0 {fill:#E31E24} a > b {stroke:#000}]]></style><path class="fil0" d="M0 0h9"/>',
    );
    const clean = sanitiseSvg(corel);
    assert.equal(clean.includes('CDATA'), false);
    assert.match(clean, /a &gt; b/);
    assert.equal(svgIsSafe(clean), true);
  });

  it('keeps a same-document use, which the old filter deleted', () => {
    const logo = wrap('<defs><path id="p" d="M0 0h9"/></defs><use href="#p"/>');
    assert.equal(sanitiseSvg(logo), logo);
  });
});
