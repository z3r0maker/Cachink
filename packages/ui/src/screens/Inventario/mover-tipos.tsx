/**
 * The two kinds of inventory move at the top of the sheet (MvInventario):
 * «Llegó mercancía» and «Se echó a perder o se dañó (merma)», a radio group
 * whose chosen option is yellow with the black edge (El Mostrador §2).
 */
import type { ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import type { TipoMovimiento } from '@xangarro/caja/inventario';
import { MText } from '../../components/index';
import { borderWidths, colors, radii, shadows } from '../../theme';

const TIPOS: readonly (readonly [TipoMovimiento, string])[] = [
  ['Entrada', 'Llegó mercancía'],
  ['Merma', 'Se echó a perder o se dañó (merma)'],
];

const opcion = (on: boolean): ViewStyle => ({
  flex: 1,
  minHeight: 58,
  paddingHorizontal: 10,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[2],
  borderWidth: borderWidths.thin,
  borderColor: on ? colors.black : 'transparent',
  backgroundColor: on ? colors.yellow : 'transparent',
  boxShadow: on ? shadows.pressed : undefined,
});

export function Tipos(p: {
  readonly value: TipoMovimiento;
  readonly onChange: (t: TipoMovimiento) => void;
}): ReactElement {
  return (
    <View
      role="radiogroup"
      aria-label="Tipo de movimiento"
      flexDirection="row"
      gap={4}
      padding={4}
      borderRadius={radii[4]}
      backgroundColor={colors.gray100}
    >
      {TIPOS.map(([k, label]) => (
        <Pressable
          key={k}
          testID={`mover-tipo-${k}`}
          role="radio"
          aria-label={label}
          aria-checked={p.value === k}
          onPress={() => p.onChange(k)}
          style={opcion(p.value === k)}
        >
          <MText
            size="md"
            weight="extraBold"
            textAlign="center"
            color={p.value === k ? colors.black : colors.gray600}
          >
            {label}
          </MText>
        </Pressable>
      ))}
    </View>
  );
}
