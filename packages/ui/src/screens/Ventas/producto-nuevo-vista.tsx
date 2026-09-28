/**
 * «Así se verá en la caja» (MvProductoNuevo): the tile the new product makes,
 * with the icon the type suggests and «Cambiar ícono» to pick another.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { Btn } from '../../components/Btn/index';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors, radii } from '../../theme';
import { PRODUCT_BG_COLORS } from '../../product-colors';
import { ProductoIcono } from './cobrar-tile';
import { ICONOS_NUEVO, type ProductoNuevoForm } from './use-producto-nuevo';

function Iconos({ f }: { f: ProductoNuevoForm }): ReactElement {
  return (
    <View
      role="radiogroup"
      aria-label="Escoge otro ícono"
      flexDirection="row"
      flexWrap="wrap"
      gap={8}
    >
      {ICONOS_NUEVO.map(([k, label]) => (
        <Pressable
          key={k}
          role="radio"
          aria-checked={k === f.icono}
          aria-label={label}
          onPress={() => f.setElegido(k)}
          style={{
            borderRadius: radii[2],
            borderWidth: borderWidths.thin,
            borderColor: k === f.icono ? colors.black : colors.white,
          }}
        >
          <ProductoIcono icono={k} tint={k === f.icono ? colors.yellow : colors.white} size={44} />
        </Pressable>
      ))}
    </View>
  );
}

function Muestra({ f }: { f: ProductoNuevoForm }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={12}
      padding={12}
      borderRadius={radii[4]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <ProductoIcono icono={f.icono} tint={PRODUCT_BG_COLORS.white} />
      <View flex={1} minWidth={0}>
        <MText size="md" weight="extraBold" numberOfLines={1}>
          {f.nombre.trim() || 'Tu producto'}
        </MText>
        <MText size="md" weight="bold" color={colors.ink}>
          {formatMoney(f.monto ?? 0n)}
        </MText>
      </View>
    </View>
  );
}

export function Vista({ f }: { f: ProductoNuevoForm }): ReactElement {
  const nota = f.elegido ? 'Ícono escogido por ti.' : 'Ícono sugerido por el tipo.';
  return (
    <View gap={10} testID="producto-nuevo-vista">
      <Eyebrow>Así se verá en la caja</Eyebrow>
      <Muestra f={f} />
      <View flexDirection="row" alignItems="center" justifyContent="space-between" gap={8}>
        <MText flex={1} size="sm" weight="semibold" color={colors.gray600}>
          {nota}
        </MText>
        <Btn
          variant="secondary"
          size="md"
          onPress={() => f.setCambiar(!f.cambiar)}
          testID="producto-nuevo-cambiar-icono"
        >
          {f.cambiar ? 'Listo' : 'Cambiar ícono'}
        </Btn>
      </View>
      {f.cambiar ? <Iconos f={f} /> : null}
    </View>
  );
}
