/**
 * SwipeableRow — shared contract for the platform-extension swipe primitive
 * (audit M-1 PR 4.5-T09).
 *
 * The mobile variant (`./swipeable-row.native.tsx`) wraps the row in
 * `react-native-gesture-handler`'s `Swipeable` so users can left-swipe to
 * Edit and right-swipe to Delete a list row. The web / Tauri variant
 * (`./swipeable-row.web.tsx`) is a passthrough — desktop's equivalent
 * affordance is a right-click context menu, which is out of scope for
 * this primitive (a future `<RowMenu>` primitive can wrap the same row
 * for desktop without needing gesture support).
 *
 * Per CLAUDE.md §5.3 the default export delegates to the web variant so
 * Vite-based tools (Vitest, Storybook, Tauri) resolve correctly without
 * extra config. Metro picks `./swipeable-row.native.tsx` on mobile.
 *
 * **Brand-faithful action backgrounds:**
 *   - Left action (Edit) — yellow `colors.yellow` with the §8.3 hard 2-px
 *     black border + `pencil` icon.
 *   - Right action (Delete) — red `colors.red` background, white text +
 *     `trash-2` icon.
 *
 * **Accessibility contract:**
 *   - The swipe is **never** the only way to reach the action. Every
 *     mounted SwipeableRow must compose with a tap-to-detail or
 *     long-press-menu fallback so screen-reader users and keyboard users
 *     have a non-gesture path. The audit's 3.6 + 3.7 findings (swipe is
 *     a magnifier, not the only entry point) drive this contract.
 *   - When `disabled === true`, the swipe is suppressed but the row
 *     still renders normally.
 */

import type { ReactNode } from 'react';

export interface SwipeableRowProps {
  /** Row content — a `<Card>`, `<VentaCard>`, etc. */
  readonly children: ReactNode;
  /**
   * Fires when the user swipes left-to-right past the threshold. The
   * action panel is the brand-yellow Edit affordance unless overridden
   * by `leftAction`. Omit to disable the left swipe.
   */
  readonly onSwipeLeft?: () => void;
  /**
   * Fires when the user swipes right-to-left past the threshold. The
   * action panel is the brand-red Delete affordance unless overridden
   * by `rightAction`. Omit to disable the right swipe.
   */
  readonly onSwipeRight?: () => void;
  /**
   * Optional override for the left action panel. When provided this
   * ReactNode is rendered behind the row when the user swipes
   * left-to-right; the default Edit panel is replaced.
   */
  readonly leftAction?: ReactNode;
  /**
   * Optional override for the right action panel. When provided this
   * ReactNode is rendered behind the row when the user swipes
   * right-to-left; the default Delete panel is replaced.
   */
  readonly rightAction?: ReactNode;
  /**
   * When `true`, the swipe is suppressed and the row renders as a plain
   * passthrough. The row content still renders.
   */
  readonly disabled?: boolean;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
  /**
   * Screen-reader label describing the swipe options ("Desliza
   * para editar o eliminar"). Forwarded to the root view's
   * `aria-label`. Required for a11y when both swipe handlers are
   * provided; omit when neither swipe handler is set.
   */
  readonly ariaLabel?: string;
}

// Default export for Vite/Tauri/Vitest. Metro picks
// `./swipeable-row.native.tsx`.
export { SwipeableRow } from './swipeable-row.web';
