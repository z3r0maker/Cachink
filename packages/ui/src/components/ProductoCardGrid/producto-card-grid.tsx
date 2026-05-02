/**
 * ProductoCardGrid — responsive flex-wrap grid of ProductoCard tiles.
 *
 * Columns adapt via Tamagui media tokens: 2 / 3 / 4 / 5-wide at
 * $sm / $gtSm / $gtMd / $gtLg breakpoints. Uses percentage widths
 * with gap compensation so tiles fill evenly without JS measurement.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { AttrDef, Product } from '@cachink/domain';
import { ProductoCard, type ProductoCardProps } from '../ProductoCard/index';

export interface ProductoCardGridProps {
  readonly productos: readonly Product[];
  /** Stock map keyed by product ID — pass `undefined` to hide badges. */
  readonly stockMap?: ReadonlyMap<string, number>;
  /** Attribute definitions for chip rendering (Phase D). */
  readonly atributoDefs?: readonly AttrDef[];
  readonly mode: ProductoCardProps['mode'];
  readonly onPress: ProductoCardProps['onPress'];
  readonly onLongPress?: ProductoCardProps['onLongPress'];
  readonly testID?: string;
}

const GAP = 12;

export function ProductoCardGrid(props: ProductoCardGridProps): ReactElement {
  const { productos, stockMap, atributoDefs = [], mode, onPress, onLongPress } = props;
  return (
    <View
      testID={props.testID ?? 'producto-card-grid'}
      flexDirection="row"
      flexWrap="wrap"
      gap={GAP}
      paddingHorizontal={16}
    >
      {productos.map((p) => (
        <View
          key={p.id}
          flexBasis="46%"
          flexGrow={0}
          flexShrink={0}
          $gtSm={{ flexBasis: '31%' }}
          $gtMd={{ flexBasis: '23%' }}
          $gtLg={{ flexBasis: '18%' }}
        >
          <ProductoCard
            producto={p}
            stock={stockMap?.get(p.id)}
            atributoDefs={atributoDefs}
            mode={mode}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        </View>
      ))}
    </View>
  );
}
