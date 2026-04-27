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
import type { ReactElement } from 'react';
import { FlatList, View } from 'react-native';
import type { ListProps } from './list.shared';

export type { ListProps } from './list.shared';

export function List<T>(props: ListProps<T>): ReactElement {
  // Audit Round 2 G1: RN's accessibility prop is `accessibilityRole`
  // (not the `role` HTML attribute). VoiceOver / TalkBack announce
  // the FlatList as a list and expose row navigation.
  return (
    <FlatList
      testID={props.testID ?? 'list'}
      accessibilityRole="list"
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
      ListHeaderComponent={
        props.ListHeaderComponent ? () => <>{props.ListHeaderComponent}</> : undefined
      }
      ListFooterComponent={
        props.ListFooterComponent ? () => <>{props.ListFooterComponent}</> : undefined
      }
      ListEmptyComponent={
        props.ListEmptyComponent ? () => <>{props.ListEmptyComponent}</> : undefined
      }
      getItemLayout={props.getItemLayout}
      // FlatList defaults: keep scroll smooth without overspending CPU.
      initialNumToRender={12}
      maxToRenderPerBatch={8}
      windowSize={5}
      removeClippedSubviews={true}
    />
  );
}
