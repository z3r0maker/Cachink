/**
 * `@xangarro/tokens` — the single source of truth for the Xangarro! brand.
 *
 * Zero runtime dependencies, deliberately: the mobile app (Tamagui), the web
 * portal (vanilla-extract) and `scripts/design-lint` all consume this package,
 * and none of them should drag the others' dependencies along (ADR-057).
 *
 * `packages/ui/src/theme.ts` re-exports everything here, so every pre-existing
 * `import { colors } from '../theme'` keeps working unchanged.
 */

export { colors, type ColorToken } from './colors.js';
export {
  fontSizes,
  emojiSizes,
  typography,
  portalFontSizes,
  type FontSize,
  type PortalFontSize,
} from './type.js';
export {
  radii,
  denseRadii,
  shapeRadii,
  borders,
  shadows,
  pressTransform,
  type Radius,
} from './shape.js';
export { breakpoints, type BreakpointKey } from './layout.js';
export { brand } from './brand.js';

import { colors } from './colors.js';
import { typography } from './type.js';
import { radii, borders, shadows, pressTransform } from './shape.js';
import { breakpoints } from './layout.js';

export const theme = {
  colors,
  typography,
  radii,
  borders,
  shadows,
  pressTransform,
  breakpoints,
} as const;

export type Theme = typeof theme;
