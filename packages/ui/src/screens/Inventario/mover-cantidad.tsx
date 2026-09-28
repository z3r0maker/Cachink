/**
 * «¿Cuánto llegó?» / «¿Cuánto se echó a perder?» (MvInventario's sheet): −
 * and + around the quantity with its unit, 56 px targets, and what the stock
 * will be after the move. Whole units, so no keyboard: the stepper is enough
 * for what arrives or spoils in a turno.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { MText } from '../../components/index';
import { borderWidths, colors, radii } from '../../theme';

const PASO = {
  width: 56,
  height: 56,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
} as const;

function Paso(p: {
  label: string;
  signo: string;
  mas?: boolean;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      role="button"
      aria-label={p.label}
      testID={p.mas ? 'mover-mas' : 'mover-menos'}
      onPress={p.onPress}
      style={{ ...PASO, backgroundColor: p.mas ? colors.yellow : colors.white }}
    >
      <MText size="xl3" weight="extraBold">
        {p.signo}
      </MText>
    </Pressable>
  );
}

function Caja(p: { cantidad: number; unidad: string }): ReactElement {
  return (
    <View
      flex={1}
      height={56}
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      gap={8}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      aria-live="polite"
    >
      <MText size="xl5" weight="extraBold" fontVariant={['tabular-nums']} testID="mover-cantidad">
        {String(p.cantidad)}
      </MText>
      <MText size="lgx" weight="extraBold" color={colors.gray600}>
        {p.unidad}
      </MText>
    </View>
  );
}

export function Cantidad(p: {
  readonly label: string;
  readonly cantidad: number;
  readonly unidad: string;
  readonly quedan: string;
  readonly onPaso: (delta: number) => void;
}): ReactElement {
  return (
    <View gap={8}>
      <MText size="body" weight="extraBold">
        {p.label}
      </MText>
      <View flexDirection="row" alignItems="center" gap={10}>
        <Paso label="Uno menos" signo="−" onPress={() => p.onPaso(-1)} />
        <Caja cantidad={p.cantidad} unidad={p.unidad} />
        <Paso label="Uno más" signo="+" mas onPress={() => p.onPaso(1)} />
      </View>
      <MText size="md" color={colors.gray600} fontVariant={['tabular-nums']} testID="mover-quedan">
        {p.quedan}
      </MText>
    </View>
  );
}
