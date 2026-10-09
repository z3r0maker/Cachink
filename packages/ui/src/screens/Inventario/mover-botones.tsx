/**
 * The two ways a move starts (M-09): the labelled pair above the lists —
 * «Entrada de mercancía» on green, «Merma» on red, each with its arrow —
 * and the 40 px squares on each existencia's row, which open the same
 * sheets with the product already picked. The press stamp is the frame's.
 */
import type { ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import type { TipoMovimiento } from '@xangarro/caja/inventario';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';
import { flechaDe, tinteDeTipo } from './mover-glifos';

export type TipoMover = TipoMovimiento;

/** The press stamp: two into the shadow, as the frame's buttons land. */
const presionado = (p: boolean): ViewStyle | null =>
  p ? { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: shadows.pressed } : null;

/** «Entrada de mercancía» / «Merma»: the kind's tint, its arrow, its word. */
export function BotonMov(p: {
  readonly tipo: TipoMover;
  readonly onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      testID={`inventario-abrir-${p.tipo === 'Entrada' ? 'entrada' : 'merma'}`}
      role="button"
      accessibilityLabel={p.tipo === 'Entrada' ? 'Entrada de mercancía' : 'Registrar merma'}
      onPress={p.onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        paddingHorizontal: 14,
        borderRadius: radii[3],
        borderWidth: borderWidths.thick,
        borderColor: colors.black,
        backgroundColor: tinteDeTipo(p.tipo),
        boxShadow: shadows.card,
        ...presionado(pressed),
      })}
    >
      <PathIcon d={flechaDe(p.tipo)} size={17} strokeWidth={2.4} />
      <MText size="sm" weight="extraBold" style={{ textTransform: 'uppercase' }}>
        {p.tipo === 'Entrada' ? 'Entrada de mercancía' : 'Merma'}
      </MText>
    </Pressable>
  );
}

/** The row's quick square: 40 px, the kind's arrow on its tint. */
export function BotonFila(p: {
  readonly tipo: TipoMover;
  readonly nombre: string;
  readonly onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      testID={`inventario-fila-${p.tipo === 'Entrada' ? 'entrada' : 'merma'}`}
      role="button"
      accessibilityLabel={`${p.tipo === 'Entrada' ? 'Registrar entrada' : 'Registrar merma'} de ${p.nombre}`}
      onPress={p.onPress}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii[2],
        borderWidth: borderWidths.thin,
        borderColor: colors.black,
        backgroundColor: tinteDeTipo(p.tipo),
        boxShadow: shadows.small,
        ...presionado(pressed),
      })}
    >
      <PathIcon d={flechaDe(p.tipo)} size={16} strokeWidth={2.6} />
    </Pressable>
  );
}

/** The kind's pill on a movement row: «Entrada» green, «Merma» red. */
export function EtiquetaTipo(p: { readonly tipo: TipoMover }): ReactElement {
  return (
    <View
      paddingHorizontal={11}
      paddingVertical={3}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={tinteDeTipo(p.tipo)}
    >
      <MText size="tag" weight="extraBold">
        {p.tipo}
      </MText>
    </View>
  );
}
