import { describe, expect, it } from 'vitest';

import { consoleTheme } from '../src/index.js';

/** WCAG relative luminance of a `#RRGGBB` colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('console themes', () => {
  it('name the same roles in both themes', () => {
    expect(Object.keys(consoleTheme.dark).sort()).toEqual(Object.keys(consoleTheme.light).sort());
  });

  for (const [name, t] of Object.entries(consoleTheme)) {
    it(`${name}: text roles read at 4.5:1 on panels`, () => {
      for (const role of ['text', 'body', 'dim', 'ok', 'warn', 'bad'] as const) {
        expect(contrast(t[role], t.surface)).toBeGreaterThanOrEqual(4.5);
        // The dark console also sets running text straight on the page.
        if (name === 'dark') expect(contrast(t[role], t.raised)).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
