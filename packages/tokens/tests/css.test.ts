import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { rootCss, cssVarName, cssVars, emittedVarNames } from '../src/css.js';
import { colors, radii, shadows } from '../src/index.js';

/**
 * The portal's `:root` block is generated, never hand-written. These tests pin
 * the two failures that a hand-maintained copy actually produced in the design
 * system's `colors_and_type.css`: tokens silently missing, and a name that
 * drifted from the source.
 */
describe('cssVarName', () => {
  it('kebab-cases camelCase token names', () => {
    assert.equal(cssVarName('yellowDeep'), '--yellow-deep');
    assert.equal(cssVarName('textMuted'), '--text-muted');
    assert.equal(cssVarName('gray100'), '--gray100');
  });

  it('leaves an already-flat name alone', () => {
    assert.equal(cssVarName('yellow'), '--yellow');
  });
});

describe('rootCss', () => {
  const css = rootCss();

  it('emits every colour token — none may be dropped', () => {
    const missing = Object.keys(colors).filter((k) => !css.includes(`${cssVarName(k)}:`));
    assert.deepEqual(missing, []);
  });

  it('emits the eight tokens the design system stylesheet is missing', () => {
    for (const v of [
      '--text-muted',
      '--green-text',
      '--red-text',
      '--blue-text',
      '--warning-text',
      '--purple',
      '--cyan',
      '--scrim',
    ]) {
      assert.ok(css.includes(`${v}:`), `${v} must be emitted`);
    }
  });

  it('carries the hero yellow and ink black verbatim', () => {
    assert.ok(css.includes('--yellow: #FFD60A;'));
    assert.ok(css.includes('--black: #0D0D0D;'));
  });

  it('emits every radius on the ladder', () => {
    for (const r of radii) {
      assert.ok(css.includes(`--r-${r}: ${r}px;`), `--r-${r} must be emitted`);
    }
  });

  it('emits only hard shadows — no blur, no rgba', () => {
    for (const [name, value] of Object.entries(shadows)) {
      assert.ok(css.includes(`${cssVarName(`shadow-${name}`)}: ${value};`));
    }
    const shadowLines = css.split('\n').filter((l) => l.includes('--shadow-'));
    for (const line of shadowLines) {
      assert.ok(!line.includes('rgba'), line);
      assert.match(line, /: \d+px \d+px 0 /);
    }
  });

  it('emits the only two border widths that exist', () => {
    assert.ok(css.includes('--border-thin: 2px;'));
    assert.ok(css.includes('--border-thick: 2.5px;'));
  });

  it('is a single well-formed :root block', () => {
    assert.ok(css.startsWith(':root {\n'));
    assert.ok(css.trimEnd().endsWith('}'));
    assert.equal(css.split('{').length - 1, 1);
  });
});

describe('emittedVarNames', () => {
  it('reports every name the block declares, for contract generation', () => {
    const names = emittedVarNames();
    assert.ok(names.length > Object.keys(colors).length);
    assert.ok(names.every((n) => n.startsWith('--')));
    assert.equal(new Set(names).size, names.length, 'no duplicate custom properties');
  });
});

describe('cssVars', () => {
  it('returns the same declarations as rootCss, as a record', () => {
    const vars = cssVars();
    const css = rootCss();
    for (const [name, value] of Object.entries(vars)) {
      assert.ok(css.includes(`${name}: ${value};`), `${name} must agree with rootCss`);
    }
    assert.equal(Object.keys(vars).length, emittedVarNames().length);
  });

  it('carries values with no trailing semicolon, ready for vanilla-extract', () => {
    const vars = cssVars();
    assert.equal(vars['--yellow'], '#FFD60A');
    assert.equal(vars['--shadow-card'], '4px 4px 0 #0D0D0D');
    assert.ok(Object.values(vars).every((v) => !v.endsWith(';')));
  });
});
