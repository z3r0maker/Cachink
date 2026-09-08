import { describe, it, expect } from 'vitest';
import { colors, shadows, borders, typography, radii, emojiSizes } from '../src/theme';

describe('Cachink brand theme', () => {
  it('exposes the hero yellow exactly as specified in CLAUDE.md §8.1', () => {
    expect(colors.yellow).toBe('#FFD60A');
  });

  it('exposes the ink-black exactly', () => {
    expect(colors.black).toBe('#0D0D0D');
  });

  it('defines only hard drop shadows — never soft, never rgba', () => {
    for (const shadow of Object.values(shadows)) {
      expect(shadow).not.toContain('rgba');
      expect(shadow).not.toContain('blur');
      expect(shadow).toMatch(/^\d+px \d+px 0 /);
    }
  });

  it('defines only 2px or 2.5px black borders', () => {
    expect(borders.thin).toBe('2px solid #0D0D0D');
    expect(borders.thick).toBe('2.5px solid #0D0D0D');
  });

  it('defines weights from 400 through 900', () => {
    expect(typography.weights.regular).toBe(400);
    expect(typography.weights.black).toBe(900);
  });

  it('defines the fixed radii scale', () => {
    expect(radii).toEqual([8, 10, 12, 14, 16, 18, 20, 22]);
  });

  it('defines a type scale that ascends without duplicates', () => {
    const steps = Object.values(typography.sizes);
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(new Set(steps).size).toBe(steps.length);
  });

  it('never goes below the 12px reading floor', () => {
    // 61 call sites sat at 9-11px before the 2026-09 audit. Cachink is read at
    // arm's length on a shop counter; nothing in it needs to be smaller.
    for (const step of Object.values(typography.sizes)) {
      expect(step).toBeGreaterThanOrEqual(12);
    }
  });

  it('keeps emoji illustration sizes off the type ramp', () => {
    // Emoji rendered as pictures must not be snapped onto the text scale.
    const steps: readonly number[] = Object.values(typography.sizes);
    for (const size of Object.values(emojiSizes)) {
      expect(steps).not.toContain(size);
    }
  });
});

/**
 * WCAG 2.1 relative luminance and contrast ratio.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function luminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** WCAG AA for normal-size text. */
const AA = 4.5;

describe('colour contrast', () => {
  /** Every light ground a text token can land on. */
  const grounds = [colors.white, colors.offwhite, colors.gray100];

  const textTokens: ReadonlyArray<readonly [string, string, string | null]> = [
    ['textMuted', colors.textMuted, null],
    ['greenText', colors.greenText, colors.greenSoft],
    ['redText', colors.redText, colors.redSoft],
    ['blueText', colors.blueText, colors.blueSoft],
    ['warningText', colors.warningText, colors.warningSoft],
  ];

  it.each(textTokens)('%s clears AA on every ground it can sit on', (_name, fg, soft) => {
    for (const bg of [...grounds, ...(soft === null ? [] : [soft])]) {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
    }
  });

  it('keeps ink and black legible on the hero yellow', () => {
    expect(contrast(colors.black, colors.yellow)).toBeGreaterThanOrEqual(AA);
    expect(contrast(colors.ink, colors.yellow)).toBeGreaterThanOrEqual(AA);
  });

  it('proves the danger button needs a black label, not a white one', () => {
    // The brand red is fixed; only the label colour is ours to choose.
    expect(contrast(colors.white, colors.red)).toBeLessThan(AA);
    expect(contrast(colors.black, colors.red)).toBeGreaterThanOrEqual(AA);
  });

  it('documents why gray400 must not be used for text', () => {
    for (const bg of grounds) {
      expect(contrast(colors.gray400, bg)).toBeLessThan(AA);
    }
  });
});
