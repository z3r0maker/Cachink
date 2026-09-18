/**
 * Cachink brand tokens — the neobrutalist-yellow visual DNA.
 *
 * **The tokens moved.** They now live in `@xangarro/tokens`, a zero-dependency
 * package, so that the web portal can consume them without pulling in this
 * package's tree (`@xangarro/application`, `@xangarro/data`, `drizzle-orm`,
 * `exceljs`, `jspdf`, `@react-pdf/renderer`, `html2canvas`, `bcryptjs`,
 * `@sentry/browser`). See ADR-057 and task P-22.
 *
 * This file stays as a re-export so that every existing
 * `import { colors } from '../theme'` keeps working — no call site changed.
 * New code may import from `@xangarro/tokens` directly.
 *
 * Do not add colors, sizes, or shadows here. Add them in `@xangarro/tokens`.
 */

export {
  colors,
  fontSizes,
  emojiSizes,
  typography,
  radii,
  shapeRadii,
  borders,
  shadows,
  pressTransform,
  breakpoints,
  theme,
  type ColorToken,
  type FontSize,
  type Radius,
  type BreakpointKey,
  type Theme,
} from '@xangarro/tokens';
