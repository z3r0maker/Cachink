/**
 * The camera sheet's bottom row (MvFotoCamara): the gallery circle on the
 * left, the yellow shutter in the middle, the torch on the right — lit
 * yellow while it is on.
 */
import type { ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { PathIcon } from '../components/PathIcon/index';
import { borderWidths, colors, shapeRadii } from '../theme';
import { FOTO_GLIFOS } from './foto-glifos';

const redondo = (lado: number): ViewStyle => ({
  width: lado,
  height: lado,
  borderRadius: shapeRadii.pill,
  alignItems: 'center',
  justifyContent: 'center',
});

const ARO: ViewStyle = { borderWidth: borderWidths.thin, borderColor: colors.white };
const ARO_ENCENDIDO: ViewStyle = {
  borderWidth: borderWidths.thin,
  borderColor: colors.yellow,
  backgroundColor: colors.yellow,
};
const DISPARADOR: ViewStyle = {
  ...redondo(80),
  backgroundColor: colors.white,
  borderWidth: borderWidths.thick,
  borderColor: colors.black,
};

function Disparador(p: { readonly onPress: () => void; readonly ocupado: boolean }): ReactElement {
  return (
    <Pressable
      testID="foto-disparar"
      role="button"
      aria-label="Tomar la foto"
      disabled={p.ocupado}
      onPress={p.onPress}
      style={({ pressed }) => [DISPARADOR, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
    >
      <View
        width={60}
        height={60}
        borderRadius={shapeRadii.pill}
        backgroundColor={colors.yellow}
        borderWidth={borderWidths.thick}
        borderColor={colors.black}
      />
    </Pressable>
  );
}

function Linterna(p: { readonly encendida: boolean; readonly onPress: () => void }): ReactElement {
  return (
    <Pressable
      testID="foto-linterna"
      role="button"
      aria-label="Linterna"
      aria-pressed={p.encendida}
      onPress={p.onPress}
      style={[redondo(56), p.encendida ? ARO_ENCENDIDO : ARO]}
    >
      <PathIcon
        d={FOTO_GLIFOS.linterna}
        size={22}
        strokeWidth={2.2}
        color={p.encendida ? colors.black : colors.white}
      />
    </Pressable>
  );
}

export function ControlesCamara(p: {
  readonly onGaleria: () => void;
  readonly onDisparar: () => void;
  readonly ocupado: boolean;
  readonly linterna: boolean;
  readonly onLinterna: () => void;
}): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal={28}
      paddingTop={18}
    >
      <Pressable
        testID="foto-camara-galeria"
        role="button"
        aria-label="Elegir una foto de la galería"
        onPress={p.onGaleria}
        style={[redondo(56), ARO]}
      >
        <PathIcon d={FOTO_GLIFOS.galeria} size={24} strokeWidth={2.2} color={colors.white} />
      </Pressable>
      <Disparador onPress={p.onDisparar} ocupado={p.ocupado} />
      <Linterna encendida={p.linterna} onPress={p.onLinterna} />
    </View>
  );
}
