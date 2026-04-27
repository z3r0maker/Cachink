/**
 * Icon — shared types + constants (no platform extension).
 *
 * Lives separately from `./icon.tsx` so the platform variants
 * (`icon.web.tsx`, `icon.native.tsx`) can pull the type contract without
 * Metro/Vite ever resolving back to the platform file. Importing
 * `./icon` from `icon.native.tsx` would self-cycle on RN because Metro
 * picks `icon.native.tsx` first when resolving `./icon`. Routing the
 * type imports through this `*.shared.ts` file is the canonical Metro
 * platform-extension fix (see CLAUDE.md §5.3 and ADR-040).
 */

/**
 * Curated icon set used across the design mocks (April 2026 stakeholder
 * review). Adding a name here is the only way to surface a new icon in
 * `packages/ui` runtime code; this list is the source of truth.
 *
 * Adding a name: pick the kebab-case Lucide identifier from
 * https://lucide.dev/icons and append below in the matching group.
 */
export type IconName =
  // Bottom-tab + navigation
  | 'home'
  | 'layout-dashboard'
  | 'layout-grid'
  | 'settings'
  | 'ellipsis'
  // Money + transactions
  | 'dollar-sign'
  | 'banknote'
  | 'wallet'
  | 'coins'
  | 'hand-coins'
  | 'credit-card'
  | 'receipt'
  | 'archive'
  // Inventory + commerce
  | 'package'
  | 'scan-barcode'
  | 'shopping-bag'
  // Reporting
  | 'chart-bar'
  | 'trending-up'
  | 'trending-down'
  // Action affordances
  | 'plus'
  | 'minus'
  | 'x'
  | 'check'
  | 'share-2'
  | 'pencil'
  | 'trash-2'
  // People + status
  | 'users'
  | 'user'
  | 'bell'
  | 'circle-alert'
  | 'info'
  | 'file-text'
  // Form affordances (PR 2 — audit input rewrite)
  | 'eye'
  | 'eye-off'
  | 'camera'
  | 'calendar'
  | 'search'
  // Wizard / help-modal scenarios (PR 2 — emoji→Icon sweep)
  | 'smartphone'
  | 'building-2'
  | 'cake'
  | 'truck'
  | 'utensils'
  | 'clipboard-list'
  // Wizard step 2/2A/2B/3 mode-pickers (PR 2.5-T08 — emoji→Icon sweep)
  | 'hard-drive'
  | 'cloud'
  | 'plug'
  | 'monitor'
  // Chevrons (avatar/disclosure)
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right';

export interface IconProps {
  /** Curated icon name. See `IconName` for the full set. */
  readonly name: IconName;
  /** Render size in px (square). Defaults to 24. */
  readonly size?: number;
  /**
   * Stroke + fill color. Accepts any CSS color string. Defaults to
   * `currentColor` so the icon inherits its container's text color.
   */
  readonly color?: string;
  /**
   * Stroke weight in px. Defaults to 2 to match the §8.3 brand
   * border weights (`borders.thin = 2px`).
   */
  readonly strokeWidth?: number;
  /** Forwarded so E2E tests can anchor to the icon. */
  readonly testID?: string;
  /**
   * Screen-reader label. When omitted the icon is treated as
   * decorative (`aria-hidden`). Pass when the icon is the *only*
   * label (icon-only buttons, badges).
   */
  readonly ariaLabel?: string;
}

/** Default size — matches the §8.3 22-radius scale visual weight. */
export const ICON_DEFAULT_SIZE = 24;
/** Default stroke — matches the §8.3 2-px border weight. */
export const ICON_DEFAULT_STROKE = 2;
