/**
 * «¿Cuánto llegó?» / «¿Cuánto se echó a perder?» (RvInventario's sheet): −
 * and + around a field that takes the quantity typed, with its unit, 56 px
 * targets, and what the stock will be after the move. Stepping to 300 is
 * not realistic, so the field types; a merma that doesn't fit turns it red
 * and the line under it says only what there is (M9).
 */
import type { ReactElement } from 'react';
import { Pressable, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { MText } from '../../components/index';
import { borderWidths, colors, fontFace, portalFontSizes, radii, typography } from '../../theme';
import type { Quedan } from './mover-logica';

const PASO = {
  width: 56,
  height: 56,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
} as const;

const TONO: Readonly<Record<Quedan['tono'], string>> = {
  bien: colors.greenText,
  rojo: colors.redText,
  quieto: colors.gray600,
};

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

/** The typed figure: right-aligned beside its unit, red when it doesn't fit. */
const cifra = (tinta: string) =>
  ({
    minWidth: 48,
    maxWidth: 110,
    textAlign: 'right',
    ...fontFace(typography.weights.extraBold),
    fontSize: portalFontSizes.xl3,
    color: tinta,
  }) as const;

function Campo(p: {
  raw: string;
  unidad: string;
  rojo: boolean;
  onRaw: (v: string) => void;
}): ReactElement {
  const tinta = p.rojo ? colors.redText : colors.black;
  return (
    <View
      flex={1}
      minWidth={0}
      height={56}
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      gap={6}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thick}
      borderColor={tinta}
      backgroundColor={colors.white}
    >
      <TextInput
        testID="mover-cantidad"
        aria-label="Cantidad"
        aria-invalid={p.rojo}
        inputMode="numeric"
        keyboardType="number-pad"
        selectTextOnFocus
        value={p.raw}
        onChangeText={p.onRaw}
        style={cifra(tinta)}
      />
      <MText size="body" weight="extraBold" color={colors.gray600}>
        {p.unidad}
      </MText>
    </View>
  );
}

export function Cantidad(p: {
  readonly label: string;
  readonly raw: string;
  readonly unidad: string;
  readonly quedan: Quedan;
  readonly onRaw: (v: string) => void;
  readonly onPaso: (delta: number) => void;
}): ReactElement {
  return (
    <View gap={8}>
      <MText size="body" weight="extraBold">
        {p.label}
      </MText>
      <View flexDirection="row" alignItems="center" gap={8}>
        <Paso label="Uno menos" signo="−" onPress={() => p.onPaso(-1)} />
        <Campo raw={p.raw} unidad={p.unidad} rojo={p.quedan.tono === 'rojo'} onRaw={p.onRaw} />
        <Paso label="Uno más" signo="+" mas onPress={() => p.onPaso(1)} />
      </View>
      <MText
        size="md"
        weight="extraBold"
        color={TONO[p.quedan.tono]}
        fontVariant={['tabular-nums']}
        aria-live="polite"
        testID="mover-quedan"
      >
        {p.quedan.texto}
      </MText>
    </View>
  );
}
