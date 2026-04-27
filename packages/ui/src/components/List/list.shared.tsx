/**
 * `<List>` — shared types + visual contract.
 *
 * Closes audit finding 3.6 (foundation): every list screen in the app
 * uses `.map()` to render rows. At Phase-1 scale (a few dozen rows
 * per screen) this is fine; at month-3 scale (50 ventas/day × 90 days
 * = 4 500 rows) every keystroke in the search box re-renders the
 * entire list. The audit's "tech debt that will hurt in 3 months"
 * #1 item.
 *
 * The `<List>` primitive is the migration path. On RN it delegates to
 * `<FlatList>` (the React Native built-in virtualization primitive —
 * `@shopify/flash-list` was rejected per CLAUDE.md "fewer deps" rule).
 * On web/Tauri, where document-flow scrolling and modern browser
 * virtualization (CSS contain-intrinsic-size, content-visibility) is
 * adequate at the row counts Phase 1 ships, the variant renders a
 * straight `.map()` inside a `<View>` — same surface area, no extra
 * dep. The web target can later swap to `@tanstack/react-virtual`
 * by replacing the `.web.tsx` body without changing call sites; the
 * follow-up is documented in ROADMAP M-1 PR 4 follow-ups.
 *
 * The shared interface mirrors `FlatListProps` for the props that
 * matter (data, renderItem, keyExtractor, header / footer / empty
 * components, optional getItemLayout for fixed-height rows). It
 * deliberately does NOT expose the long tail of FlatList tunables —
 * if a screen needs them, that's a sign the list deserves its own
 * primitive, not a `<List>` migration.
 */
import type { ReactElement, ReactNode } from 'react';

export interface ListItemMetadata {
  readonly length: number;
  readonly offset: number;
  readonly index: number;
}

export interface ListProps<T> {
  /** The full row dataset. */
  readonly data: readonly T[];
  /** Renders one row. Receives item + index. */
  readonly renderItem: (item: T, index: number) => ReactNode;
  /** Stable key per row — required for both FlatList and React's reconciler. */
  readonly keyExtractor: (item: T, index: number) => string;
  /** Rendered above the first row. Optional. */
  readonly ListHeaderComponent?: ReactNode;
  /** Rendered below the last row. Optional. */
  readonly ListFooterComponent?: ReactNode;
  /**
   * Rendered when `data.length === 0`. The header / footer still
   * render — same shape as FlatList's prop semantics.
   */
  readonly ListEmptyComponent?: ReactNode;
  /**
   * Optional row-size advisor for FlatList's
   * window-of-rendered-rows heuristic. Pass when every row has the
   * same fixed height — perf jumps from "linear scan" to "constant
   * scroll-anchor lookup". Web variant ignores this prop (the
   * browser handles row-size resolution natively).
   *
   * `ArrayLike<T>` mirrors React Native's FlatList type — the
   * runtime payload is the same `data` array that was passed in,
   * but the FlatList contract widens it to ArrayLike so callers can
   * pass either a real array or a `readonly T[]` slice.
   */
  readonly getItemLayout?: (
    data: ArrayLike<T> | null | undefined,
    index: number,
  ) => ListItemMetadata;
  /** Forwarded to the root container — anchor for E2E tests. */
  readonly testID?: string;
}

/**
 * Marker re-exported so callers can land the type without importing
 * a platform variant directly.
 */
export type ListComponent = <T>(props: ListProps<T>) => ReactElement;
