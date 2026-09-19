import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  dominantColor,
  dominantSvgFill,
  sanitiseSvg,
  svgIsSafe,
} from '../../src/comprobante/index.js';

describe('sanitiseSvg (N-19: malicious SVG is neutralised)', () => {
  it('strips a script element and its payload', () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><circle r="9"/></svg>';
    const clean = sanitiseSvg(dirty);
    assert.equal(svgIsSafe(clean), true);
    assert.equal(clean.includes('alert'), false);
    assert.match(clean, /circle/);
  });

  it('strips foreignObject and event handlers', () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" onload="steal()"/>' +
      '<foreignObject><body>x</body></foreignObject></svg>';
    const clean = sanitiseSvg(dirty);
    assert.equal(svgIsSafe(clean), true);
    assert.equal(clean.includes('onload'), false);
    assert.equal(clean.toLowerCase().includes('foreignobject'), false);
  });

  it('strips javascript: and data: hrefs, self-closing script and DOCTYPE tricks', () => {
    const dirty =
      '<!DOCTYPE svg [<!ENTITY x "<script>bad()</script>">]>' +
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
      '<a xlink:href="javascript:bad()"><text>hi</text></a><script xlink:href="data:text/js,bad()"/>' +
      '</svg>';
    const clean = sanitiseSvg(dirty);
    assert.equal(svgIsSafe(clean), true);
    assert.equal(clean.toLowerCase().includes('javascript:'), false);
    assert.equal(clean.toLowerCase().includes('data:text'), false);
  });

  it('keeps an honest logo intact', () => {
    const honest =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#d4a017" d="M4 4h16v16H4z"/></svg>';
    assert.equal(sanitiseSvg(honest), honest);
  });
});

describe('dominantColor', () => {
  const px = (r: number, g: number, b: number, a = 255) => [r, g, b, a];

  it('picks the saturated brand colour over more numerous greys', () => {
    const rgba = [
      ...px(200, 200, 200),
      ...px(200, 200, 200),
      ...px(200, 200, 200),
      ...px(212, 40, 60),
      ...px(212, 40, 60),
    ];
    const hex = dominantColor(rgba);
    assert.match(hex ?? '', /^#d4283/);
  });

  it('returns null for pure line art (no colour at all)', () => {
    assert.equal(dominantColor([...px(0, 0, 0), ...px(255, 255, 255)]), null);
  });

  it('ignores transparent pixels', () => {
    assert.equal(dominantColor([...px(220, 30, 40, 0)]), null);
  });
});

describe('dominantSvgFill', () => {
  it('takes the most-used non-neutral fill', () => {
    const svg =
      '<svg><path fill="#000000" d=""/><path fill="#0a7dbd" d=""/><rect fill="#0a7dbd"/></svg>';
    assert.equal(dominantSvgFill(svg), '#0a7dbd');
  });

  it('null when the file only draws neutrals', () => {
    assert.equal(dominantSvgFill('<svg><path fill="#333" d=""/></svg>'), null);
  });
});
