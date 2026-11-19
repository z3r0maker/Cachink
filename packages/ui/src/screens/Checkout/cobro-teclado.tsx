/**
 * The cobro's keypad (board MvCobroTotal): four rows that share the height
 * left on the phone, never under 44 px and never over 64.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { TECLAS, type Tecla } from './cobro-logic';
import { TECLA_MAX, TECLA_MIN } from './cobro-medidas';

const FILAS: readonly (readonly Tecla[])[] = [0, 3, 6, 9].map((i) => TECLAS.slice(i, i + 3));

function TeclaBoton(p: { k: Tecla; onTecla: (k: Tecla) => void }): ReactElement {
  const { k } = p;
  return (
    <Pressable
      testID={`cobro-tecla-${k}`}
      role="button"
      aria-label={k === 'borrar' ? 'Borrar' : k === '.' ? 'Punto' : k}
      onPress={() => p.onTecla(k)}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii[2],
        borderWidth: borderWidths.quiet,
        borderColor: borderColors.quiet,
        backgroundColor: pressed ? colors.gray200 : colors.white,
      })}
    >
      {k === 'borrar' ? (
        <PathIcon d={COBRAR_GLYPHS.borrar} size={22} />
      ) : (
        <MText size="xl2" weight="extraBold" maxFontSizeMultiplier={1.2}>
          {k}
        </MText>
      )}
    </Pressable>
  );
}

export function TecladoCobro(p: {
  readonly separacion: number;
  readonly onTecla: (k: Tecla) => void;
}): ReactElement {
  return (
    <View role="group" aria-label="Teclado de números" flex={1} gap={p.separacion}>
      {FILAS.map((fila) => (
        <View
          key={fila.join('')}
          flexDirection="row"
          flex={1}
          gap={p.separacion}
          minHeight={TECLA_MIN}
          maxHeight={TECLA_MAX}
        >
          {fila.map((k) => (
            <TeclaBoton key={k} k={k} onTecla={p.onTecla} />
          ))}
        </View>
      ))}
    </View>
  );
}
