/**
 * The two ways out of «El turno de Ana sigue abierto» (M-18, MvTurnoDeOtro):
 * continue the caja's turno or count and close it. Option cards, not a
 * dropdown (two choices); the selected card is the action the foot takes.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { TURNO_DE_OTRO } from '@xangarro/caja/turno';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii, shadows } from '../../theme';

export type Opcion = 'seguir' | 'cerrar';

const SEGUIR = 'M5 12h14M13 6l6 6-6 6';
const CERRAR =
  'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2ZM7 11V7a5 5 0 0 1 10 0v4';

function Icono({ d }: { readonly d: string }): ReactElement {
  return (
    <View
      width={44}
      height={44}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <PathIcon d={d} size={22} strokeWidth={2.2} />
    </View>
  );
}

function Tarjeta(p: {
  readonly on: boolean;
  readonly d: string;
  readonly titulo: string;
  readonly hint: string;
  readonly onPress: () => void;
  readonly testID: string;
}): ReactElement {
  return (
    <Pressable
      onPress={p.onPress}
      role="radio"
      aria-checked={p.on}
      aria-label={p.titulo}
      testID={p.testID}
    >
      <View
        flexDirection="row"
        alignItems="flex-start"
        gap={12}
        padding={14}
        borderRadius={radii[4]}
        borderWidth={p.on ? borderWidths.thick : borderWidths.quiet}
        borderColor={colors.black}
        backgroundColor={p.on ? colors.yellowSoft : colors.white}
        style={p.on ? { boxShadow: shadows.small } : undefined}
      >
        <Icono d={p.d} />
        <View flex={1} minWidth={0} gap={3}>
          <MText size="lg" weight="extraBold">
            {p.titulo}
          </MText>
          <MText size="sm" weight="semibold" color={colors.ink}>
            {p.hint}
          </MText>
        </View>
      </View>
    </Pressable>
  );
}

export function Opciones(p: {
  readonly titular: string;
  readonly opcion: Opcion;
  readonly elegir: (o: Opcion) => void;
}): ReactElement {
  return (
    <View role="radiogroup" gap={12}>
      <Tarjeta
        on={p.opcion === 'seguir'}
        d={SEGUIR}
        titulo={TURNO_DE_OTRO.seguir(p.titular)}
        hint={TURNO_DE_OTRO.seguirHint}
        onPress={() => p.elegir('seguir')}
        testID="turno-de-otro-seguir"
      />
      <Tarjeta
        on={p.opcion === 'cerrar'}
        d={CERRAR}
        titulo={TURNO_DE_OTRO.cerrar(p.titular)}
        hint={TURNO_DE_OTRO.cerrarHint}
        onPress={() => p.elegir('cerrar')}
        testID="turno-de-otro-cerrar"
      />
    </View>
  );
}
