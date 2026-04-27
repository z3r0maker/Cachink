/**
 * `<List>` — desktop / web (Tauri) variant.
 *
 * Vite-based tools (Vitest, Storybook, Tauri) resolve this file via
 * the default import chain `./List/index → ./list.tsx`. Metro picks
 * `./list.native.tsx` on RN.
 *
 * Renders the row tree as a straight `.map()` inside a `<View>` for
 * Phase 1. Document-flow scrolling and modern browser optimisations
 * (CSS `content-visibility`, `contain-intrinsic-size`) handle row-
 * windowing adequately at the row counts Phase 1 ships. The follow-up
 * to `@tanstack/react-virtual` is one swap of this file's body
 * without changing the public surface or call sites.
 */
import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import type { ListProps } from './list.shared';

export type { ListProps } from './list.shared';

export function List<T>(props: ListProps<T>): ReactElement {
  const isEmpty = props.data.length === 0;
  // Audit Round 2 G1: ARIA `role="list"` so screen readers announce
  // the row collection as a list and expose row navigation. Header /
  // footer / empty slots intentionally render outside any inner
  // listitem-role View — they're descriptive chrome, not data rows.
  return (
    <View testID={props.testID ?? 'list'} flexDirection="column" role="list">
      {props.ListHeaderComponent !== undefined && props.ListHeaderComponent}
      {isEmpty
        ? props.ListEmptyComponent
        : props.data.map((item, index) => (
            <View key={props.keyExtractor(item, index)}>
              {/* renderItem returns a ReactNode (typically the brand
               * row primitive). Wrap in a keyed View so each row has
               * a stable identity for React's reconciler. */}
              {props.renderItem(item, index) as ReactNode}
            </View>
          ))}
      {props.ListFooterComponent !== undefined && props.ListFooterComponent}
    </View>
  );
}
