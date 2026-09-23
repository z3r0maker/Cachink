/**
 * scan.ts — the Xangarro design-system rule engine.
 *
 * Exists because no off-the-shelf detector can read this codebase. Styling
 * lives in Tamagui props and JS token objects, not CSS, so HTML/CSS engines
 * (including `impeccable detect`) report zero findings on all 871 UI files
 * while real defects sit in them. These rules read the shapes we actually
 * write.
 *
 * The rules themselves live in `./rules` — token drift in `rules/token.ts`,
 * accessibility in `rules/a11y.ts`. This file decides only which files are
 * governed and in what order the rule sets run.
 */

import { blankComments } from './jsx';
import { scanJsx } from './rules/a11y';
import { isThemeSource, scanTokens } from './rules/token';
import type { Finding, Push } from './rules/types';

export type { Finding, Severity } from './rules/types';

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

/**
 * Drawings on a fixed canvas, where a number is a **coordinate**, not a CSS
 * pixel.
 *
 * `fontSize={12}` inside a `560`-wide `viewBox` is not twelve pixels of type:
 * the canvas scales to its container, so that glyph lands at whatever size the
 * card happens to be — around 27px on a wide screen. Snapping it to the type
 * ramp would change the drawing's proportions and mean nothing, and reaching
 * for `portalFontSizes.xs` would tell the next reader a lie about what the
 * number is.
 *
 * Both surfaces here are transcribed from the design files coordinate by
 * coordinate: the login animation on its `460×200` stage, and the Estados
 * charts on the `560×214`, `700×180`, `180×106` and `120×120` canvases the
 * handoff draws them on. Their geometry **is** the spec; the token scale
 * describes the page around them.
 *
 * The bar for adding to this list is that the file's numbers are meaningless
 * outside a `viewBox` or a stage of a fixed size. A component that merely
 * looks drawn does not qualify. Audit 2026-09.
 */
const LIENZOS_FIJOS = [
  /\/app\/login\/(animation|escena-)/,
  /\/estados\/(cascada|donut|flujo-barras|gauge)\.tsx$/,
];

function isExempt(file: string): boolean {
  return (
    /\.(test|spec|stories)\.[jt]sx?$/.test(file) ||
    /\/(tests?|dev)\//.test(file) ||
    UNGOVERNED.test(file) ||
    LIENZOS_FIJOS.some((r) => r.test(file))
  );
}

/** Run every rule against one file. */
export function scanFile(file: string, source: string): readonly Finding[] {
  if (isExempt(file)) return [];
  const found: Finding[] = [];
  const push: Push = (f) => {
    found.push({ ...f, file });
  };
  // Blank comments once: a hex in a JSDoc block is documentation, and a
  // `<Pressable>` mentioned in one is prose, not markup.
  const clean = blankComments(source);
  if (!isThemeSource(file)) scanTokens(clean, push);
  if (file.endsWith('.tsx')) scanJsx(clean, push);
  return found;
}
