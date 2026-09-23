/**
 * Token rules — literal values that should have come from `@xangarro/tokens`.
 *
 * The palette and the radius ladder are imported from the token package
 * rather than restated here, per CLAUDE.md §2.3: the linter can never drift
 * from the design system it enforces.
 */

import { colors, denseRadii, radii } from '../../../packages/tokens/src/index';
import type { LineRule, Push } from './types';

const THEME_HEX: ReadonlySet<string> = new Set(Object.values(colors).map((c) => c.toUpperCase()));
const RADII: ReadonlySet<number> = new Set([...radii, ...Object.values(denseRadii)]);
/** Off-ladder shapes that are still legitimate: chart marks and full pills. */
const SHAPE_RADII: ReadonlySet<number> = new Set([2, 4, 9999]);
/** Borders are always 2 or 2.5px solid black; 0 means "no border" and is fine. */
const BORDER_WIDTHS: ReadonlySet<string> = new Set(['0', '2', '2.5']);

const SOFT_SHADOW = 'token/soft-shadow';
const OFFSCALE_BORDER = 'token/borderwidth-offscale';

export function isThemeSource(file: string): boolean {
  return /(theme|tamagui\.config|chart-tokens)\.ts$/.test(file);
}

/** Raw colour values that should have come from `colors`. */
const colourLiterals: LineRule = (raw, line, push) => {
  for (const hex of raw.match(/#[0-9A-Fa-f]{6}\b/g) ?? []) {
    const known = THEME_HEX.has(hex.toUpperCase());
    push({
      rule: known ? 'token/hex-inline-duplicate' : 'token/hex-offscale',
      severity: known ? 'P3' : 'P2',
      line,
      detail: hex,
    });
  }
  for (const rgba of raw.match(/rgba?\([^)]*\)/g) ?? []) {
    push({ rule: 'token/rgba-literal', severity: 'P2', line, detail: rgba });
  }
};

/**
 * Corner radii off the documented ladder.
 *
 * Tamagui writes `borderRadius={14}`; vanilla-extract writes
 * `borderRadius: '14px'`. One regex covers both — the quote and the unit are
 * optional. `radii` is the same ladder either way.
 */
const radiusLiterals: LineRule = (raw, line, push) => {
  for (const m of raw.matchAll(/borderRadius[:=]\s*\{?\s*['"`]?(\d+)(?:px)?/g)) {
    const value = Number(m[1]);
    // Zero is a reset — `borderRadius: 0` on an inset card says «no corner
    // here», which every scale implies and none needs a step for.
    if (value !== 0 && !RADII.has(value) && !SHAPE_RADII.has(value)) {
      push({ rule: 'token/radius-offscale', severity: 'P2', line, detail: `${value}` });
    }
  }
};

/** Border widths off the ladder, in both the longhand and shorthand forms. */
const borderLiterals: LineRule = (raw, line, push) => {
  for (const m of raw.matchAll(/borderWidth[:=]\s*\{?\s*['"`]?([\d.]+)(?:px)?/g)) {
    if (!BORDER_WIDTHS.has(m[1] ?? '')) {
      push({ rule: OFFSCALE_BORDER, severity: 'P2', line, detail: `${m[1]}` });
    }
  }
  // CSS `border` shorthand: `border: '2.5px solid #0D0D0D'`. Only 2 and 2.5
  // exist (CLAUDE.md §8.3); `0` means "no border" and is fine.
  for (const m of raw.matchAll(/\bborder(?:Top|Right|Bottom|Left)?[:=]\s*['"`]([\d.]+)px\s/g)) {
    if (!BORDER_WIDTHS.has(m[1] ?? '')) {
      push({ rule: OFFSCALE_BORDER, severity: 'P2', line, detail: `${m[1]}px` });
    }
  }
};

/**
 * The blur radius of one `boxShadow` layer, or `undefined` when the layer
 * declares fewer than three lengths.
 *
 * Lengths may be unitless when zero (`0 0 8px …`), so a `px`-only match
 * silently mis-indexes the blur. Read the leading numeric tokens instead.
 */
function blurOf(layer: string): number | undefined {
  const lengths: number[] = [];
  for (const part of layer
    .trim()
    .replace(/^inset\s+/, '')
    .split(/\s+/)) {
    const n = /^(-?[\d.]+)(?:px|rem|em)?$/.exec(part);
    if (n === null) break;
    lengths.push(Number.parseFloat(n[1] ?? '0'));
  }
  return lengths[2];
}

/** Shadows are hard drops, so every declared blur radius must be 0. */
const shadowLiterals: LineRule = (raw, line, push) => {
  if (/shadowRadius[:=]\s*\{?\s*[1-9]/.test(raw)) {
    push({ rule: SOFT_SHADOW, severity: 'P2', line, detail: 'blurred shadow' });
  }
  for (const m of raw.matchAll(/boxShadow[:=]\s*['"`]([^'"`]+)['"`]/g)) {
    const value = m[1] ?? '';
    if (value === 'none') continue;
    for (const layer of value.split(/,(?![^(]*\))/)) {
      const blur = blurOf(layer);
      if (blur !== undefined && blur !== 0) {
        push({ rule: SOFT_SHADOW, severity: 'P2', line, detail: layer.trim() });
      }
    }
  }
};

/** Type values that bypass the scale, and Dynamic Type opt-outs. */
const typeLiterals: LineRule = (raw, line, push) => {
  // A raw fontSize is drift by definition now that `fontSizes` exists:
  // 498 literals across 18 values is what its absence produced.
  for (const m of raw.matchAll(/fontSize(?:=\{|:\s*)(\d+)/g)) {
    push({ rule: 'token/fontsize-literal', severity: 'P2', line, detail: `${m[1]}px` });
  }
  if (/allowFontScaling\s*=\s*\{?false/.test(raw)) {
    push({
      rule: 'a11y/font-scaling-disabled',
      severity: 'P1',
      line,
      detail: 'Dynamic Type disabled',
    });
  }
};

const LINE_RULES: readonly LineRule[] = [
  colourLiterals,
  radiusLiterals,
  borderLiterals,
  shadowLiterals,
  typeLiterals,
];

/** Literal-value drift away from the documented token scales. */
export function scanTokens(source: string, push: Push): void {
  source.split('\n').forEach((raw, index) => {
    for (const rule of LINE_RULES) rule(raw, index + 1, push);
  });
}
