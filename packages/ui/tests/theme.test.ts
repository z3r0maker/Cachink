import { describe, it, expect } from 'vitest';
import { colors, shadows, borders, typography, radii } from '../src/theme';

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
});
