/**
 * TopBar — the Cachink sticky-header primitive.
 *
 * Fixed-position top shell rendered on every screen. Holds three slots:
 * `left` (back button, role chip, greeting), a centered title block with
 * optional subtitle, and `right` (settings cog, sync-state chip). The
 * shared layout lives in `top-bar.shared.tsx`; the native variant adds
 * safe-area top padding while the web/desktop variant keeps the original
 * geometry. This file is the contract + default web export for Vite.
 */

export type { TopBarProps } from './top-bar.shared';
export { TopBar } from './top-bar.web';
