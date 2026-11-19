/**
 * «El turno de Ana sigue abierto» (M-21, ADR-071 §3; board MvTurnoDeOtro):
 * right after someone signs in while another person's turno is open on this
 * caja. One turno per caja: the newcomer continues it (their sales go into
 * it) or counts and closes it, then opens their own. «No soy …, volver» goes
 * back to «¿Quién va a cobrar?». Presentational: the host hands it the words
 * and the three ways out.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { TURNO_DE_OTRO } from '@xangarro/caja/turno';
import { Btn } from '../../components/Btn/index';
import { Don } from '../../components/Don/index';
import { InicialesBadge, MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { SafeAreaSpacer } from '../../components/index';
import { borderWidths, colors, radii } from '../../theme';
import { Opciones, type Opcion } from './turno-de-otro-opciones';

export interface TurnoDeOtroScreenProps {
  /** «Caja 1 · Taquería Don Pedro», from the session. */
  readonly contexto: string | null;
  /** Whoever opened the caja's turno, full name. */
  readonly titular: string;
  readonly iniciales: string;
  /** «Desde las 08:15 · fondo $500.00 · 6 ventas». */
  readonly detalle: string;
  /** The operator who just signed in. */
  readonly operador: string;
  readonly onSeguir: () => void;
  readonly onCerrar: () => void;
  readonly onVolver: () => void;
}

function Cabeza(p: TurnoDeOtroScreenProps): ReactElement {
  return (
    <View
      gap={14}
      paddingHorizontal={16}
      paddingVertical={16}
      backgroundColor={colors.yellow}
      borderBottomWidth={borderWidths.thick}
      borderBottomColor={colors.black}
    >
      <View flexDirection="row" alignItems="center" gap={10}>
        <Don pose="hola" size={84} />
        <View flex={1} minWidth={0} gap={2}>
          {p.contexto === null ? null : <Eyebrow color={colors.ink}>{p.contexto}</Eyebrow>}
          <MText role="heading" aria-level={1} size="xl3" weight="extraBold" letterSpacing={-0.8}>
            {TURNO_DE_OTRO.titulo(p.titular)}
          </MText>
        </View>
      </View>
      <Persona {...p} />
    </View>
  );
}

/** Whoever opened the turno, and what it holds. */
function Persona(p: TurnoDeOtroScreenProps): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      minHeight={56}
      paddingLeft={8}
      paddingRight={14}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <InicialesBadge iniciales={p.iniciales} size={38} />
      <View flex={1} minWidth={0}>
        <MText size="body" weight="extraBold">
          {p.titular}
        </MText>
        <MText size="sm" weight="semibold" color={colors.ink} fontVariant={['tabular-nums']}>
          {p.detalle}
        </MText>
      </View>
    </View>
  );
}

function Pie(p: TurnoDeOtroScreenProps & { readonly opcion: Opcion }): ReactElement {
  const seguir = p.opcion === 'seguir';
  return (
    <View
      gap={10}
      paddingHorizontal={16}
      paddingTop={12}
      paddingBottom={16}
      backgroundColor={colors.white}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={colors.gray200}
    >
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        onPress={seguir ? p.onSeguir : p.onCerrar}
        testID="turno-de-otro-cta"
      >
        {seguir ? TURNO_DE_OTRO.seguirCta : TURNO_DE_OTRO.cerrarCta(p.titular)}
      </Btn>
      <Btn
        variant="secondary"
        size="lg"
        sentence
        fullWidth
        onPress={p.onVolver}
        testID="turno-de-otro-volver"
      >
        {TURNO_DE_OTRO.volver(p.operador)}
      </Btn>
    </View>
  );
}

export function TurnoDeOtroScreen(p: TurnoDeOtroScreenProps): ReactElement {
  const [opcion, setOpcion] = useState<Opcion>('seguir');
  return (
    <View flex={1} backgroundColor={colors.offwhite} testID="turno-de-otro">
      <View backgroundColor={colors.yellow}>
        <SafeAreaSpacer />
      </View>
      <Cabeza {...p} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <MText size="md" weight="semibold" color={colors.ink}>
          {TURNO_DE_OTRO.cuerpo(p.operador, p.titular)}
        </MText>
        <Opciones titular={p.titular} opcion={opcion} elegir={setOpcion} />
      </ScrollView>
      <Pie {...p} opcion={opcion} />
      <SafeAreaSpacer edge="bottom" />
    </View>
  );
}
