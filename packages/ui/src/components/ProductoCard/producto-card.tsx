/**
 * ProductoCard — vertical tile for catalogue display and quick-sell.
 *
 * Two modes:
 *   - `sell` — tapping triggers quick-sell. No overflow menu.
 *   - `manage` — shows a ⋯ icon corner for edit/delete. Long-press for bulk.
 *
 * Stock badge uses `greenSoft/warningSoft/redSoft` tones per
 * `umbralStockBajo` threshold from CLAUDE.md §9.
 *
 * Cross-platform: no `.native.tsx` split needed (pure composition).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney } from '@cachink/domain';
import type { AttrDef, Product } from '@cachink/domain';
import { Card } from '../Card/card';
import { Tag } from '../Tag/tag';
import { colors, typography } from '../../theme';

export interface ProductoCardProps {
  readonly producto: Product;
  /** Current stock level — hide badge when undefined (e.g., services). */
  readonly stock?: number;
  /** Attribute definitions for chip rendering (populated in Phase D). */
  readonly atributoDefs?: readonly AttrDef[];
  /** `sell` hides ⋯ icon; `manage` shows it. */
  readonly mode: 'sell' | 'manage';
  readonly disabled?: boolean;
  readonly onPress: (p: Product) => void;
  readonly onLongPress?: (p: Product) => void;
  readonly testID?: string;
}

function StockBadge({ stock, umbral }: { stock: number; umbral: number }): ReactElement {
  const bg = stock <= 0 ? colors.redSoft : stock <= umbral ? colors.warningSoft : colors.greenSoft;
  const fg = stock <= 0 ? colors.red : stock <= umbral ? colors.warning : colors.green;
  return (
    <View
      backgroundColor={bg}
      paddingHorizontal={8}
      paddingVertical={2}
      borderRadius={8}
      alignSelf="flex-start"
    >
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} fontSize={12} color={fg}>
        {stock}
      </Text>
    </View>
  );
}

function AttrChips({ producto, defs }: { producto: Product; defs: readonly AttrDef[] }): ReactElement | null {
  if (defs.length === 0) return null;
  const chips = defs
    .filter((d) => producto.atributos[d.clave] !== undefined)
    .slice(0, 3);
  if (chips.length === 0) return null;
  return (
    <View flexDirection="row" gap={4} flexWrap="wrap" marginTop={4}>
      {chips.map((d) => (
        <Tag key={d.clave} variant="neutral">
          {producto.atributos[d.clave] ?? ''}
        </Tag>
      ))}
    </View>
  );
}

export function ProductoCard(props: ProductoCardProps): ReactElement {
  const { producto, stock, atributoDefs = [], mode, disabled } = props;
  return (
    <Card
      testID={props.testID ?? `producto-tile-${producto.id}`}
      padding="sm"
      onPress={disabled ? undefined : () => props.onPress(producto)}
      ariaLabel={producto.nombre}
    >
      <View gap={4}>
        <View flexDirection="row" justifyContent="space-between" alignItems="flex-start">
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={14}
            color={colors.black}
            numberOfLines={2}
            flex={1}
          >
            {producto.nombre}
          </Text>
          {mode === 'manage' && (
            <Text
              fontFamily={typography.fontFamily}
              fontSize={16}
              color={colors.gray400}
              onPress={(e) => {
                e?.stopPropagation?.();
                props.onLongPress?.(producto);
              }}
            >
              ⋯
            </Text>
          )}
        </View>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={16}
          color={colors.black}
        >
          {formatMoney(producto.precioVentaCentavos)}
        </Text>
        {stock !== undefined && (
          <StockBadge stock={stock} umbral={producto.umbralStockBajo} />
        )}
        <AttrChips producto={producto} defs={atributoDefs} />
      </View>
    </Card>
  );
}
