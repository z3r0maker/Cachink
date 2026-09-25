import { createGlobalTheme, createTheme, createThemeContract } from '@vanilla-extract/css';
import { consoleTheme } from '@xangarro/tokens';

/**
 * The console's colour roles as CSS variables (`consoleTheme` in
 * `@xangarro/tokens`). `:root` carries the light brand, so the sign-in pages
 * look exactly as before; the console shell puts `torreDark` on its frame and
 * every primitive in `ui.css.ts` turns dark underneath it.
 */
export const t = createThemeContract({
  bg: null,
  surface: null,
  raised: null,
  line: null,
  lineSoft: null,
  text: null,
  body: null,
  dim: null,
  accent: null,
  onAccent: null,
  shade: null,
  ok: null,
  warn: null,
  bad: null,
  off: null,
  okSoft: null,
  warnSoft: null,
  badSoft: null,
  infoSoft: null,
  accentSoft: null,
  heat1: null,
  heat2: null,
  heat3: null,
  heat4: null,
});

createGlobalTheme(':root', t, consoleTheme.light);

export const torreDark = createTheme(t, consoleTheme.dark);

/** Borders in the theme's line colour: the same 2 / 2.5 px, never another width. */
export const line = {
  thin: `2px solid ${t.line}`,
  thick: `2.5px solid ${t.line}`,
} as const;

/** Hard shadows in the theme's shade: invisible-quiet on dark, black on light. */
export const shade = {
  small: `3px 3px 0 ${t.shade}`,
  card: `4px 4px 0 ${t.shade}`,
  pressed: `1px 1px 0 ${t.shade}`,
} as const;

/** Monospace for figures, IDs and times: the console's «instrument» voice. */
export const monoStack = "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
