/**
 * One catalogue tile (MvCobrar, TbCobrar): the product's icon on its tint,
 * «Quedan N» in red when a tracked product runs low, the name and the price,
 * and the black quantity badge once it is in the ticket. The whole tile is the
 * target; a tap adds one.
 */
import type { ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import type { ProductIcon } from '@xangarro/domain';
import { Icon } from '../../components/Icon/index';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';
import type { ProductoCobrar } from './cobrar-catalogo';

/** The product glyph in its 40 px tinted square, as the tile and the ticket draw it. */
export function ProductoIcono(props: {
  readonly icono: ProductIcon;
  readonly tint: string;
  readonly size?: number;
}): ReactElement {
  const size = props.size ?? 40;
  return (
    <View
      width={size}
      height={size}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={props.tint}
      aria-hidden
    >
      <Icon
        name={props.icono as Parameters<typeof Icon>[0]['name']}
        size={Math.round(size * 0.5)}
        color={colors.black}
      />
    </View>
  );
}

function Quedan({ n }: { n: number }): ReactElement {
  return (
    <View
      paddingHorizontal={7}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.redText}
      backgroundColor={colors.redSoft}
    >
      <MText size="tag" weight="extraBold" color={colors.redText}>
        {`Quedan ${n}`}
      </MText>
    </View>
  );
}

/** The black badge with the yellow count, over the tile's corner. */
export function CantidadBadge({ n }: { n: number }): ReactElement {
  return (
    <View
      position="absolute"
      top={-9}
      right={-9}
      minWidth={28}
      height={28}
      paddingHorizontal={6}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.white}
      backgroundColor={colors.black}
    >
      <MText size="md" weight="extraBold" color={colors.yellow}>
        {String(n)}
      </MText>
    </View>
  );
}

const TILE: ViewStyle = {
  height: 108,
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: radii[4],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
};

export function CobrarTile(props: {
  readonly p: ProductoCobrar;
  readonly qty: number;
  readonly onAdd: () => void;
}): ReactElement {
  const { p } = props;
  const precio = formatMoney(p.precio);
  return (
    <Pressable
      testID={`cobrar-tile-${p.id}`}
      role="button"
      aria-label={`Agregar ${p.nombre}, ${precio}`}
      onPress={props.onAdd}
      style={({ pressed }) => [
        TILE,
        pressed
          ? { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: shadows.pressed }
          : { boxShadow: shadows.small },
      ]}
    >
      <View flexDirection="row" alignItems="center" gap={6}>
        <ProductoIcono icono={p.icono} tint={p.tint} />
        {p.quedan !== null ? <Quedan n={p.quedan} /> : null}
      </View>
      <View alignSelf="stretch" alignItems="flex-start">
        <MText size="md" weight="extraBold" numberOfLines={1} textAlign="left">
          {p.nombre}
        </MText>
        <MText size="md" weight="bold" color={colors.ink} textAlign="left">
          {precio}
        </MText>
      </View>
      {props.qty > 0 ? <CantidadBadge n={props.qty} /> : null}
    </Pressable>
  );
}
