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
import { formatMoney, resolveProductIcon } from '@cachink/domain';
import type { AttrDef, Product, ProductIcon } from '@cachink/domain';
import { Card } from '../Card/card';
import { Icon } from '../Icon/icon';
import { Tag } from '../Tag/tag';
import { colors, typography } from '../../theme';
import { PRODUCT_BG_COLORS } from '../../product-colors';
import { QuantityBadge, type BadgeVariant } from './quantity-badge';

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
  /** Enhancement A: quantity in the cart, renders a badge overlay. */
  readonly badgeCount?: number;
  /** Enhancement G: badge colour — `yellow` (ventas) or `red` (merma). */
  readonly badgeVariant?: BadgeVariant;
  /** Explicit override for the product icon. Defaults to producto.icono. */
  readonly icono?: ProductIcon | null;
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

function AttrChips({
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

function CardHeader(props: {
  producto: ProductoCardProps['producto'];
  mode?: string;
  onLongPress?: (p: ProductoCardProps['producto']) => void;
}): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="flex-start">
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={14}
        color={colors.black}
        numberOfLines={2}
        flex={1}
      >
        {props.producto.nombre}
      </Text>
      {props.mode === 'manage' && (
        <Text
          fontFamily={typography.fontFamily}
          fontSize={16}
          color={colors.gray400}
          onPress={(e) => {
            e?.stopPropagation?.();
            props.onLongPress?.(props.producto);
          }}
        >
          ⋯
        </Text>
      )}
    </View>
  );
}

function CardBody({ producto, stock, atributoDefs, mode, onLongPress, resolvedIcon }: {
  producto: Product; stock?: number; atributoDefs: readonly AttrDef[];
  mode: 'sell' | 'manage'; onLongPress?: (p: Product) => void;
  resolvedIcon: string;
}): ReactElement {
  return (
    <>
      <View gap={4} alignItems="center">
        <Icon name={resolvedIcon as Parameters<typeof Icon>[0]['name']} size={28} color={colors.black} />
      </View>
      <View gap={4}>
        <CardHeader producto={producto} mode={mode} onLongPress={onLongPress} />
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={16}
          color={colors.black}
          numberOfLines={1}
        >
          {formatMoney(producto.precioVentaCentavos)}
        </Text>
        {stock !== undefined && <StockBadge stock={stock} umbral={producto.umbralStockBajo} />}
        <AttrChips producto={producto} defs={atributoDefs} />
      </View>
    </>
  );
}

export function ProductoCard(props: ProductoCardProps): ReactElement {
  const { producto, stock, atributoDefs = [], mode, disabled } = props;
  const bg = PRODUCT_BG_COLORS[producto.colorFondo ?? 'white'];
  const badge = (props.badgeCount ?? 0) > 0;
  const resolvedIcon = resolveProductIcon(
    props.icono !== undefined ? props.icono : producto.icono,
    producto.categoria,
  );
  return (
    <View position="relative">
      {badge && <QuantityBadge count={props.badgeCount!} variant={props.badgeVariant} />}
      <Card
        testID={props.testID ?? `producto-tile-${producto.id}`}
        padding="sm"
        onPress={disabled ? undefined : () => props.onPress(producto)}
        ariaLabel={producto.nombre}
        backgroundColor={bg}
      >
        <CardBody
          producto={producto} stock={stock} atributoDefs={atributoDefs}
          mode={mode} onLongPress={props.onLongPress} resolvedIcon={resolvedIcon}
        />
      </Card>
    </View>
  );
}
