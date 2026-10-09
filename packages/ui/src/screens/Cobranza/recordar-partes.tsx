/**
 * The fields of «Recordarle su saldo» (MvRecordarSaldo): the client's number
 * after the +52, checked for its ten digits, and the message in a WhatsApp
 * bubble, editable, with the way back to the original.
 */
import type { ReactElement } from 'react';
import { Pressable, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { MText } from '../../components/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  typography,
} from '../../theme';
import { telValido } from './cobranza-logic';

const LETRA = { fontFamily: typography.fontFamily, color: colors.black } as const;

const TEL = {
  ...LETRA,
  flex: 1,
  height: 44,
  fontWeight: '800',
  fontSize: portalFontSizes.lgx,
} as const;

const MSG = {
  ...LETRA,
  minHeight: 132,
  fontWeight: '600',
  fontSize: portalFontSizes.body,
} as const;

function CampoTel(p: { tel: string; onTel: (t: string) => void }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      height={50}
      paddingHorizontal={14}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <MText size="body" weight="extraBold" color={colors.textMuted}>
        +52
      </MText>
      <View width={borderWidths.quiet} height={22} backgroundColor={borderColors.quiet} />
      <TextInput
        testID="recordar-telefono"
        aria-label="Su número"
        inputMode="tel"
        autoComplete="tel"
        value={p.tel}
        onChangeText={(t) => p.onTel(t.replace(/[^0-9 ]/g, ''))}
        style={TEL}
      />
    </View>
  );
}

export function Numero(p: { tel: string; onTel: (t: string) => void }): ReactElement {
  return (
    <View gap={6}>
      <MText size="md" weight="extraBold">
        Su número
      </MText>
      <CampoTel {...p} />
      {telValido(p.tel) ? null : (
        <MText
          role="status"
          size="sm"
          weight="bold"
          color={colors.redText}
          testID="recordar-tel-malo"
        >
          Faltan números: son 10 dígitos.
        </MText>
      )}
    </View>
  );
}

/** The message in a sent WhatsApp bubble, on the chat's gray. */
function Burbuja(p: { msg: string; onMsg: (m: string) => void }): ReactElement {
  return (
    <View
      paddingVertical={14}
      paddingLeft={36}
      paddingRight={14}
      borderRadius={radii[6]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.gray100}
    >
      <View
        paddingHorizontal={12}
        paddingVertical={10}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        borderRadius={radii[6]}
        borderTopRightRadius={radii[0]}
        backgroundColor={colors.greenSoft}
      >
        <TextInput
          testID="recordar-mensaje"
          aria-label="Mensaje"
          multiline
          value={p.msg}
          onChangeText={p.onMsg}
          style={MSG}
        />
      </View>
    </View>
  );
}

export function Mensaje(p: {
  msg: string;
  editado: boolean;
  onMsg: (m: string) => void;
  onOriginal: () => void;
}): ReactElement {
  return (
    <View gap={6}>
      <View flexDirection="row" alignItems="baseline" justifyContent="space-between" gap={8}>
        <MText size="md" weight="extraBold">
          Mensaje
        </MText>
        <MText size="sm" weight="semibold" color={colors.textMuted}>
          Así le llega. Puedes cambiarlo.
        </MText>
      </View>
      <Burbuja msg={p.msg} onMsg={p.onMsg} />
      {p.editado ? (
        <Pressable
          testID="recordar-original"
          role="button"
          onPress={p.onOriginal}
          style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}
        >
          <MText size="sm" weight="bold" color={colors.blueText} textDecorationLine="underline">
            Volver al mensaje original
          </MText>
        </Pressable>
      ) : null}
    </View>
  );
}
