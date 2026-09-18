import { globalStyle } from '@vanilla-extract/css';
import { cssVars } from '@xangarro/tokens/css';

/**
 * The `:root` custom properties, generated from `@xangarro/tokens`.
 *
 * Nothing here is typed by hand. A second hand-maintained copy of the palette
 * is precisely how the design system's `colors_and_type.css` came to be missing
 * eight tokens and to colour body text with `gray400`, which the palette
 * explicitly forbids for text (ADR-057).
 *
 * Components should prefer importing the token values directly — vanilla-extract
 * resolves them at build time and `design-lint` can see them. These custom
 * properties exist for the cases that must stay dynamic: print stylesheets and
 * any third-party surface that can only be themed through CSS.
 */
globalStyle(':root', { vars: cssVars() });
