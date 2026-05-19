/**
 * StockBadge + AttrChips — extracted from producto-card.tsx
 * to keep the main file under 200 lines.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { AttrDef, Product } from '@cachink/domain';
import { Tag } from '../Tag/tag';
import { colors, typography } from '../../theme';

export function StockBadge({ stock, umbral }: { stock: number; umbral: number }): ReactElement {
  const bg = stock <= 0 ? colors.redSoft : stock <= umbral ? colors.warningSoft : colors.greenSoft;
  const fg = stock <= 0 ? colors.red : stock <= umbral ? colors.warning : colors.green;
  return (
    <View
      backgroundColor={bg}
      paddingHorizontal={8}
      paddingVertical={2}
      borderRadius={8}
      alignSelf="flex-start"
      flexDirection="row"
      flexWrap="nowrap"
      flexShrink={0}
      gap={4}
      alignItems="center"
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={11}
        color={fg}
        flexShrink={0}
      >
        Stock
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        color={fg}
        flexShrink={0}
      >
        {stock}
      </Text>
    </View>
  );
}

export function AttrChips({
  producto,
  defs,
}: {
  producto: Product;
  defs: readonly AttrDef[];
}): ReactElement | null {
  if (defs.length === 0) return null;
  const chips = defs.filter((d) => producto.atributos[d.clave] !== undefined).slice(0, 3);
  if (chips.length === 0) return null;
  return (
    <View flexDirection="row" gap={4} flexWrap="wrap" marginTop={4}>
      {chips.map((d) => (
        <Tag key={d.clave} variant="soft">
          {producto.atributos[d.clave] ?? ''}
        </Tag>
      ))}
    </View>
  );
}
