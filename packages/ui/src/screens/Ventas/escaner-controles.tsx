/**
 * The escáner's controls under the camera (MvEscaner): the torch, «Escribir
 * el código» and the typed code with «Buscar», for a code the camera cannot
 * read or a hardware reader.
 */
import { useState, type ReactElement } from 'react';
import { Pressable, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { Btn } from '../../components/Btn/index';
import { Eyebrow } from '../../components/Panel/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, fontFace, portalFontSizes, radii, typography } from '../../theme';
import { COBRAR_GLYPHS } from './cobrar-glyphs';

/**
 * The characters a barcode can carry: digits for EAN and UPC, and Code 39's
 * letters and signs (Code 128 is a superset). The keypad shows digits; a
 * hardware keyboard or a reader paired to a tablet can type the rest.
 */
const NO_CODIGO = /[^0-9A-Za-z\-. $/+%]/g;

function CodigoInput(p: {
  readonly codigo: string;
  readonly setCodigo: (t: string) => void;
  readonly onSubmit: () => void;
}): ReactElement {
  return (
    <TextInput
      autoCorrect={false}
      testID="escaner-codigo"
      aria-label="Números del código de barras"
      inputMode="numeric"
      autoCapitalize="characters"
      placeholder="7501234567897"
      placeholderTextColor={colors.textMuted}
      value={p.codigo}
      onChangeText={(t) => p.setCodigo(t.replace(NO_CODIGO, ''))}
      onSubmitEditing={p.onSubmit}
      style={{
        flex: 1,
        height: 48,
        paddingHorizontal: 14,
        borderRadius: radii[3],
        borderWidth: borderWidths.thin,
        borderColor: colors.black,
        ...fontFace(typography.weights.bold),
        fontSize: portalFontSizes.lg,
        color: colors.black,
      }}
    />
  );
}

export function Manual({ onBuscar }: { onBuscar: (c: string) => void }): ReactElement {
  const [codigo, setCodigo] = useState('');
  const buscar = (): void => {
    if (codigo.trim() === '') return;
    onBuscar(codigo);
    setCodigo('');
  };
  return (
    <View gap={6}>
      <Eyebrow>Escribe los números del código</Eyebrow>
      <View flexDirection="row" gap={8}>
        <CodigoInput codigo={codigo} setCodigo={setCodigo} onSubmit={buscar} />
        <Btn variant="primary" size="lg" sentence onPress={buscar} testID="escaner-buscar">
          Buscar
        </Btn>
      </View>
    </View>
  );
}

const LUZ = {
  width: 52,
  height: 52,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
} as const;

export function Controles(p: {
  luz: boolean;
  onLuz: () => void;
  manual: boolean;
  onManual: () => void;
}): ReactElement {
  return (
    <View flexDirection="row" gap={10}>
      <Pressable
        testID="escaner-luz"
        role="button"
        aria-label="Linterna"
        aria-pressed={p.luz}
        onPress={p.onLuz}
        style={{ ...LUZ, backgroundColor: p.luz ? colors.yellow : colors.white }}
      >
        <PathIcon d={COBRAR_GLYPHS.linterna} size={20} />
      </Pressable>
      <View flex={1}>
        <Btn
          variant="secondary"
          size="lg"
          fullWidth
          icon={<PathIcon d={COBRAR_GLYPHS.teclado} size={18} />}
          onPress={p.onManual}
          testID="escaner-manual"
        >
          {p.manual ? 'Mejor con la cámara' : 'Escribir el código'}
        </Btn>
      </View>
    </View>
  );
}
