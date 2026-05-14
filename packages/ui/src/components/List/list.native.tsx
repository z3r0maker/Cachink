/**
 * `<List>` — React Native variant.
 *
 * Metro auto-picks this file. Vite-based tools resolve `./list.tsx`
 * (the web variant) and never load this one (other than vitest, where
 * `react-native` aliases to `react-native-web` — see vitest.config.ts).
 *
 * Delegates to RN's built-in `<FlatList>` so rows are virtualised:
 * only the visible window + a small offscreen buffer mounts, which
 * keeps memory flat and scroll smooth on tablet POS workflows that
 * may push 4 000+ ventas through one list (audit "tech debt #1").
 *
 * `@shopify/flash-list` was rejected per the user's "fewer deps"
 * decision; FlatList is sufficient for the row counts Cachink ships
 * and ships free with React Native.
 */
import type { ReactElement, ReactNode } from 'react';
import { FlatList, View } from 'react-native';
import type { ListProps } from './list.shared';

export type { ListProps } from './list.shared';

/** Wrap an optional ReactNode slot so FlatList receives a component function. */
function wrapSlot(node: ReactNode | undefined): (() => ReactElement) | undefined {
  return node ? () => <>{node}</> : undefined;
}

export function List<T>(props: ListProps<T>): ReactElement {
  // Audit Round 2 G1: RN's accessibility prop is `accessibilityRole`
  // (not the `role` HTML attribute). VoiceOver / TalkBack announce
  // the FlatList as a list and expose row navigation.

  // When nested inside a parent ScrollView, disable FlatList's own
  // scroll and render all items (virtualization is moot without scroll
  // ownership). Phase-1 row counts are small enough that this is fine.
  const nested = props.scrollEnabled === false;
  const batchSize = nested ? props.data.length || 1 : undefined;

  return (
    <FlatList
      testID={props.testID ?? 'list'}
      accessibilityRole="list"
      scrollEnabled={!nested}
      data={[...props.data] as T[]}
      // FlatList expects `(item, index) => ReactElement` — our shared
      // type returns ReactNode, which is broader. The runtime is
      // identical (RN renders whatever React renders); the cast is
      // a contract narrowing only.
      renderItem={({ item, index }) => (
        <View key={props.keyExtractor(item, index)}>
          {props.renderItem(item, index) as ReactElement}
        </View>
      )}
      keyExtractor={(item, index) => props.keyExtractor(item, index)}
      ListHeaderComponent={wrapSlot(props.ListHeaderComponent)}
      ListFooterComponent={wrapSlot(props.ListFooterComponent)}
      ListEmptyComponent={wrapSlot(props.ListEmptyComponent)}
      getItemLayout={props.getItemLayout}
      // When nested, render everything up-front so the parent
      // ScrollView governs scrolling. Otherwise keep the FlatList
      // virtualization defaults for smooth scrolling.
      initialNumToRender={batchSize ?? 12}
      maxToRenderPerBatch={batchSize ?? 8}
      windowSize={nested ? 21 : 5}
      removeClippedSubviews={!nested}
    />
  );
}
