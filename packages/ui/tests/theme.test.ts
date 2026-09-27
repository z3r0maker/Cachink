/**
 * `src/theme.ts` is a re-export of `@xangarro/tokens` (M-03). These tests pin
 * that: the phone reads the web's objects, not a copy, and the native-only
 * helpers are derived from them. The WCAG contrast of every text token is
 * recomputed in `packages/tokens/tests/theme.test.ts`, where the values live.
 */

import { describe, expect, it } from 'vitest';
import * as tokens from '@xangarro/tokens';
import * as theme from '../src/theme';
import { tamaguiConfig } from '../src/tamagui.config';

describe('theme re-exports @xangarro/tokens', () => {
  it.each([
    'colors',
    'fontSizes',
    'emojiSizes',
    'typography',
    'portalFontSizes',
    'radii',
    'denseRadii',
    'shapeRadii',
    'borders',
    'shadows',
    'pressTransform',
    'breakpoints',
    'theme',
  ] as const)('%s is the tokens object itself', (name) => {
    expect(theme[name]).toBe(tokens[name]);
  });

  it('carries what El Mostrador needs', () => {
    expect(theme.colors.yellowRule).toBe('#DBB80A');
    expect(theme.borders.quiet).toBe(`2px solid ${theme.colors.gray200}`);
    expect(theme.denseRadii).toEqual({ r11: 11, r13: 13 });
    expect(theme.portalFontSizes.total).toBe(38);
  });
});

describe('native-only border helpers', () => {
  it('split each border token into width and colour', () => {
    expect(theme.borderWidths).toEqual({ thin: 2, thick: 2.5, quiet: 2 });
    expect(theme.borderColors).toEqual({
      thin: theme.colors.black,
      thick: theme.colors.black,
      quiet: theme.colors.gray200,
    });
  });
});

describe('Tamagui config reads the tokens', () => {
  it('registers every palette colour, yellowRule included', () => {
    const color = tamaguiConfig.tokens.color as Record<string, { val: string }>;
    for (const [name, hex] of Object.entries(tokens.colors)) {
      expect(color[name]?.val).toBe(hex);
    }
  });

  it('registers the dense and shape radii beside the ladder', () => {
    const radius = tamaguiConfig.tokens.radius as Record<string, { val: number }>;
    expect(radius['1']?.val).toBe(8);
    expect(radius['8']?.val).toBe(22);
    expect(radius.r11?.val).toBe(11);
    expect(radius.r13?.val).toBe(13);
    expect(radius.pill?.val).toBe(9999);
  });
});
