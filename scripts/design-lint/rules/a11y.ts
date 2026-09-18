/**
 * Accessibility rules — the ones that need element structure, not just lines.
 *
 * Split out of `scan.ts` per CLAUDE.md §2.6. The JSX reading itself lives in
 * `../jsx`; this module only decides what counts as a defect.
 */

import { childrenOf, eachComponentTag, lineAt } from '../jsx';
import type { Push } from './types';

/** iOS HIG minimum tap target in pt; Material asks for 48dp. */
const MIN_TAP_TARGET = 44;

const TAPPABLE: ReadonlySet<string> = new Set([
  'Pressable',
  'TouchableOpacity',
  'TouchableHighlight',
]);

interface Tag {
  readonly name: string;
  readonly attrs: string;
  readonly end: number;
  readonly selfClosing: boolean;
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

/** An unnamed tappable is only a defect when nothing else announces it. */
function checkTappableName(tag: Tag, children: string, line: number, push: Push): void {
  const named = hasAccessibleName(tag.attrs);
  const text = rendersText(children);
  const iconOnly = !text && /<[A-Z]\w*Icon[\s/]|<Icon[\s/]/.test(children);

  if (!named && iconOnly) {
    push({ rule: 'a11y/icon-only-unlabeled', severity: 'P1', line, detail: tag.name });
  } else if (!named && !text && !tag.selfClosing) {
    push({ rule: 'a11y/tappable-no-name-no-text', severity: 'P2', line, detail: tag.name });
  }
}

/** `hitSlop` counts toward the target, so it is added before comparing. */
function checkTapTarget(tag: Tag, children: string, line: number, push: Push): void {
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
function scanTextColor(attrs: string, line: number, push: Push): void {
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
export function scanJsx(jsx: string, push: Push): void {
  for (const { tag, start } of eachComponentTag(jsx)) {
    const line = lineAt(jsx, start);
    if (TAPPABLE.has(tag.name)) {
      const children = tag.selfClosing ? '' : childrenOf(jsx, tag.name, tag.end);
      checkTappableName(tag, children, line, push);
      checkTapTarget(tag, children, line, push);
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
