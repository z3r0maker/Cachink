/**
 * CSS custom-property emitter.
 *
 * The web portal needs the palette as `:root { --yellow: #FFD60A; … }`. That
 * block is a **build artifact of this package**, never hand-written — a second
 * hand-maintained copy is exactly how the design system's own
 * `colors_and_type.css` came to be missing `textMuted`, `greenText`, `redText`,
 * `blueText`, `warningText`, `purple`, `cyan` and `scrim`, and how its
 * `.t-muted` rule ended up colouring body text with `gray400`, which
 * `colors.ts` explicitly forbids for text.
 *
 * `DESIGN_CONTRACT.md`'s token table is generated from the same functions, so
 * the contract cannot drift from the code it governs (P-19).
 */

import { colors } from './colors.js';
import { fontSizes, typography } from './type.js';
import { denseRadii, radii, shapeRadii, shadows } from './shape.js';

/** `camelCase` → `kebab-case`, so `yellowDeep` becomes `--yellow-deep`. */
export function cssVarName(token: string): string {
  return `--${token.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
}

function declarations(): readonly string[] {
  const out: string[] = [];
  for (const [name, value] of Object.entries(colors)) {
    out.push(`${cssVarName(name)}: ${value};`);
  }
  for (const [name, value] of Object.entries(fontSizes)) {
    out.push(`${cssVarName(`fontSize-${name}`)}: ${value}px;`);
  }
  for (const [name, value] of Object.entries(typography.weights)) {
    out.push(`${cssVarName(`fw-${name}`)}: ${value};`);
  }
  for (const [name, value] of Object.entries(typography.letterSpacing)) {
    out.push(`${cssVarName(`tracking-${name}`)}: ${value};`);
  }
  out.push(`--font-sans: ${typography.fontFamily};`);
  for (const value of [...radii, ...Object.values(denseRadii)]) {
    out.push(`--r-${value}: ${value}px;`);
  }
  for (const [name, value] of Object.entries(shapeRadii)) {
    out.push(`${cssVarName(`r-${name}`)}: ${value}px;`);
  }
  for (const [name, value] of Object.entries(shadows)) {
    out.push(`${cssVarName(`shadow-${name}`)}: ${value};`);
  }
  out.push('--border-thin: 2px;', '--border-thick: 2.5px;');
  return out;
}

/**
 * The same declarations as a record, for consumers that set custom properties
 * through an API rather than a stylesheet — vanilla-extract's
 * `globalStyle(':root', { vars })` takes exactly this shape.
 */
export function cssVars(): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const d of declarations()) {
    const i = d.indexOf(':');
    out[d.slice(0, i)] = d.slice(i + 1, -1).trim();
  }
  return out;
}

/** The full `:root` block. Write it to a `.css` file at build time. */
export function rootCss(): string {
  const body = declarations()
    .map((d) => `  ${d}`)
    .join('\n');
  return `:root {\n${body}\n}\n`;
}

/** Every custom-property name this package emits, for contract generation. */
export function emittedVarNames(): readonly string[] {
  return declarations().map((d) => d.slice(0, d.indexOf(':')));
}
