/**
 * Xangarro brand tokens — responsive breakpoints.
 *
 * Extracted from `packages/ui/src/theme.ts` by P-22 (ADR-057) so that the web
 * portal can consume the tokens without pulling in `@xangarro/ui`'s dependency
 * tree. That file is now a re-export of this package; nothing else moved, and
 * no call site changed.
 *
 * Do not add colours, sizes, or shadows outside this package. If a designer
 * proposes a new token, add it here with a comment explaining the use case.
 */

/**
 * Responsive breakpoints (audit M-1 PR 5.5-T01 / B1).
 *
 * Cachink ships on phones, tablets (the primary form factor — see CLAUDE.md
 * §1), and desktops. The breakpoint scale below maps Tamagui's `useMedia()`
 * keys onto the iOS / iPad / Android / desktop form-factor matrix. A
 * breakpoint key is the **minimum** parent-width threshold for which the
 * media key is active.
 *
 * Form-factor matrix (px width):
 * | Range      | Key        | Form factor                                  |
 * |------------|------------|----------------------------------------------|
 * |   0 –  480 | `sm`       | Phone portrait (iPhone, small Android)      |
 * | 481 –  768 | `gtSm`     | Phone landscape, small tablet portrait      |
 * | 769 – 1280 | `gtMd`     | Tablet landscape, iPad Pro 11", desktop     |
 * | 1281+      | `gtLg`     | Wide desktop, iPad Pro 12.9" landscape       |
 *
 * The `gt*` ("greater-than") prefix mirrors Tamagui's convention: `gtMd` is
 * "greater than the medium breakpoint", i.e. tablet landscape and up. Use
 * this for split-pane mounts (`<SplitPane>` only renders side-by-side at
 * `gtMd`+) and for switching the Director Home grid between 1/2/3 columns.
 *
 * **Rule of thumb:** prefer `gtMd` for "tablet-landscape and bigger"
 * decisions. Use `sm` (and only `sm`) for phone-portrait fallbacks. The
 * other two keys exist for symmetry with Tamagui's media-config requirement
 * — most Phase 1 surfaces won't need them.
 *
 * The `breakpoints` object is consumed by `tamagui.config.ts`'s `media`
 * setting; nothing else should re-derive these numbers.
 */
export const breakpoints = {
  sm: 0,
  gtSm: 481,
  gtMd: 769,
  gtLg: 1281,
} as const;

export type BreakpointKey = keyof typeof breakpoints;
