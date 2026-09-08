/**
 * scan.ts — the Cachink design-system rule engine.
 *
 * Exists because no off-the-shelf detector can read this codebase. Styling
 * lives in Tamagui props and JS token objects, not CSS, so HTML/CSS engines
 * (including `impeccable detect`) report zero findings on all 871 UI files
 * while real defects sit in them. These rules read the shapes we actually
 * write.
 *
 * The palette and radius ladder are imported from `packages/ui/src/theme`
 * rather than restated here, per CLAUDE.md §2.3 — the linter can never drift
 * from the design system it enforces.
 */

import { colors, radii } from '../../packages/ui/src/theme';
import { blankComments, childrenOf, eachComponentTag, lineAt } from './jsx';

export type Severity = 'P1' | 'P2' | 'P3';

export interface Finding {
  readonly rule: string;
  readonly severity: Severity;
  readonly file: string;
  readonly line: number;
  readonly detail: string;
}

const THEME_HEX: ReadonlySet<string> = new Set(Object.values(colors).map((c) => c.toUpperCase()));
const RADII: ReadonlySet<number> = new Set(radii);
/** Borders are always 2 or 2.5px solid black; 0 means "no border" and is fine. */
const BORDER_WIDTHS: ReadonlySet<string> = new Set(['0', '2', '2.5']);
/** iOS HIG minimum tap target in pt; Material asks for 48dp. */
const MIN_TAP_TARGET = 44;

const TAPPABLE: ReadonlySet<string> = new Set([
  'Pressable',
  'TouchableOpacity',
  'TouchableHighlight',
]);

/**
 * Surfaces the design system deliberately does not govern.
 *
 * `Telemetria` is a dev-only observability dashboard — its own route comments
 * and its menu label, "Registro de operaciones y errores (dev)", say so. It is
 * built on Tamagui's default tokens on purpose: looking unlike the product is
 * a useful signal that you are not in the product. Recorded here as an
 * accepted exception rather than left in the baseline as debt nobody intends
 * to pay. Audit 2026-09.
 *
 * Anything a shopkeeper can reach does not belong in this list.
 */
const UNGOVERNED = /\/screens\/Telemetria\//;

function isExempt(file: string): boolean {
  return (
    /\.(test|spec|stories)\.[jt]sx?$/.test(file) ||
    /\/(tests?|dev)\//.test(file) ||
    UNGOVERNED.test(file)
  );
}

function isThemeSource(file: string): boolean {
  return /(theme|tamagui\.config|chart-tokens)\.ts$/.test(file);
}

type LineRule = (raw: string, line: number, push: (f: Omit<Finding, 'file'>) => void) => void;

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

/** Shape values off the documented radius and border ladders. */
const shapeLiterals: LineRule = (raw, line, push) => {
  for (const m of raw.matchAll(/borderRadius[:=]\s*\{?\s*(\d+)/g)) {
    const value = Number(m[1]);
    if (!RADII.has(value)) {
      push({ rule: 'token/radius-offscale', severity: 'P2', line, detail: `${value}` });
    }
  }
  for (const m of raw.matchAll(/borderWidth[:=]\s*\{?\s*([\d.]+)/g)) {
    if (!BORDER_WIDTHS.has(m[1] ?? '')) {
      push({ rule: 'token/borderwidth-offscale', severity: 'P2', line, detail: `${m[1]}` });
    }
  }
  if (/shadowRadius[:=]\s*\{?\s*[1-9]/.test(raw)) {
    push({ rule: 'token/soft-shadow', severity: 'P2', line, detail: 'blurred shadow' });
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

const LINE_RULES: readonly LineRule[] = [colourLiterals, shapeLiterals, typeLiterals];

/** Literal-value drift away from the documented token scales. */
function scanTokens(source: string, push: (f: Omit<Finding, 'file'>) => void): void {
  source.split('\n').forEach((raw, index) => {
    for (const rule of LINE_RULES) rule(raw, index + 1, push);
  });
}

function hasAccessibleName(attrs: string): boolean {
  return /aria-label|accessibilityLabel/.test(attrs);
}

/** True when the subtree renders words a screen reader can announce. */
function rendersText(children: string): boolean {
  return (
    /<Text[\s>]/.test(children) ||
    /\{t\(/.test(children) ||
    />[^<>{}]*[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}[^<>{}]*</.test(children)
  );
}

/** Smallest declared `width`/`height` in the first stretch of a subtree. */
function declaredTapSize(segment: string): { width?: number; height?: number } {
  const sizes: { width?: number; height?: number } = {};
  for (const m of segment.matchAll(/\b(width|height)=\{(\d+)\}/g)) {
    const key = m[1] === 'width' ? 'width' : 'height';
    const value = Number(m[2]);
    const current = sizes[key];
    if (current === undefined || value < current) sizes[key] = value;
  }
  return sizes;
}

function hitSlopOf(attrs: string): number {
  const flat = attrs.match(/hitSlop=\{(\d+)\}/);
  if (flat !== null) return Number(flat[1]);
  const obj = attrs.match(/hitSlop=\{\{[^}]*top:\s*(\d+)/);
  return obj !== null ? Number(obj[1]) : 0;
}

function scanTappable(
  source: string,
  tag: { name: string; attrs: string; end: number; selfClosing: boolean },
  line: number,
  push: (f: Omit<Finding, 'file'>) => void,
): void {
  const children = tag.selfClosing ? '' : childrenOf(source, tag.name, tag.end);
  const named = hasAccessibleName(tag.attrs);
  const text = rendersText(children);
  const iconOnly = !text && /<[A-Z]\w*Icon[\s/]|<Icon[\s/]/.test(children);

  if (!named && iconOnly) {
    push({ rule: 'a11y/icon-only-unlabeled', severity: 'P1', line, detail: tag.name });
  } else if (!named && !text && !tag.selfClosing) {
    push({ rule: 'a11y/tappable-no-name-no-text', severity: 'P2', line, detail: tag.name });
  }

  const slop = hitSlopOf(tag.attrs);
  const { width, height } = declaredTapSize(children.slice(0, 400));
  const effective = [width, height]
    .filter((v): v is number => v !== undefined)
    .map((v) => v + 2 * slop);
  if (effective.length > 0 && Math.min(...effective) < MIN_TAP_TARGET) {
    push({
      rule: 'a11y/touch-target-small',
      severity: 'P2',
      line,
      detail: `${Math.min(...effective)}pt effective`,
    });
  }
}

/**
 * Surface tokens that are legible as a shape but not as a glyph.
 *
 * Each fails WCAG AA as text on at least one app surface — `gray400` is
 * 2.51:1 on the app background, `warning` on `warningSoft` is 1.63:1. The
 * `*Text` pair in `theme.ts` exists for exactly this position.
 */
const SURFACE_ONLY: Readonly<Record<string, string>> = {
  gray400: 'textMuted',
  green: 'greenText',
  red: 'redText',
  blue: 'blueText',
  warning: 'warningText',
};

/** Flag a surface-only token used to colour glyphs. */
function scanTextColor(
  attrs: string,
  line: number,
  push: (f: Omit<Finding, 'file'>) => void,
): void {
  const colorProp = attrs.match(/\bcolor\s*=\s*\{((?:[^{}]|\{[^{}]*\})*)\}/);
  if (colorProp === null) return;
  for (const m of (colorProp[1] ?? '').matchAll(/colors\.(\w+)\b/g)) {
    const replacement = SURFACE_ONLY[m[1] ?? ''];
    if (replacement !== undefined) {
      push({
        rule: 'a11y/surface-color-as-text',
        severity: 'P2',
        line,
        detail: `colors.${m[1]} -> colors.${replacement}`,
      });
    }
  }
}

/** Accessibility rules that need element structure, not just text lines. */
function scanJsx(jsx: string, push: (f: Omit<Finding, 'file'>) => void): void {
  for (const { tag, start } of eachComponentTag(jsx)) {
    const line = lineAt(jsx, start);
    if (TAPPABLE.has(tag.name)) {
      scanTappable(jsx, tag, line, push);
      continue;
    }
    if (tag.name === 'Text') {
      scanTextColor(tag.attrs, line, push);
      continue;
    }
    if (tag.name === 'Btn' && tag.selfClosing && !/ariaLabel=/.test(tag.attrs)) {
      push({
        rule: 'a11y/btn-no-children-no-label',
        severity: 'P1',
        line,
        detail: 'renders aria-label=""',
      });
    }
  }
}

/** Run every rule against one file. */
export function scanFile(file: string, source: string): readonly Finding[] {
  if (isExempt(file)) return [];
  const found: Finding[] = [];
  const push = (f: Omit<Finding, 'file'>): void => {
    found.push({ ...f, file });
  };
  // Blank comments once: a hex in a JSDoc block is documentation, and a
  // `<Pressable>` mentioned in one is prose, not markup.
  const clean = blankComments(source);
  if (!isThemeSource(file)) scanTokens(clean, push);
  if (file.endsWith('.tsx')) scanJsx(clean, push);
  return found;
}
