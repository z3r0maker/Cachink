/**
 * MvVincular's two fields: the owner's correo (a 52 px field with the mail
 * glyph) and the code as eight boxes in two groups of four, with the real
 * input lying invisible over them (the web's `vincular-campos.tsx`). Each box
 * shows its letter; the next one to fill has the black edge; a rejected code
 * turns them red.
 */
import type { ReactElement } from 'react';
import { Input as TamaguiInput } from '@tamagui/input';
import { View } from '@tamagui/core';
import { MText, PathIcon } from '../../components/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  shadows,
  typography,
} from '../../theme';
import { ACTIVATION_CODE_LENGTH, sanitizeCode } from './activation-form';

const CORREO =
  'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7';

const SIN_MARCO = {
  unstyled: true,
  borderWidth: 0,
  backgroundColor: 'transparent',
  fontFamily: typography.fontFamily,
  fontWeight: typography.weights.bold,
  fontSize: portalFontSizes.body,
  color: colors.black,
  style: { outlineWidth: 0 },
} as const;

export function CampoCorreo(props: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      height={52}
      paddingHorizontal={14}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <PathIcon d={CORREO} size={18} color={colors.gray600} />
      <TamaguiInput
        {...SIN_MARCO}
        flex={1}
        testID="activation-email"
        aria-label={props.label}
        value={props.value}
        onChangeText={props.onChange}
        keyboardType="email-address"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
      />
    </View>
  );
}

function estiloCaja(ch: string, siguiente: boolean, error: boolean) {
  if (error)
    return {
      borderWidth: borderWidths.thick,
      borderColor: colors.redText,
      backgroundColor: colors.redSoft,
    };
  if (ch !== '') {
    return {
      borderWidth: borderWidths.thick,
      borderColor: colors.black,
      backgroundColor: colors.white,
      boxShadow: shadows.pressed,
    };
  }
  return {
    borderWidth: siguiente ? borderWidths.thin : borderWidths.quiet,
    borderColor: siguiente ? colors.black : borderColors.quiet,
    backgroundColor: colors.gray100,
  };
}

function Cajas(props: { desde: number; codigo: string; error: boolean }): ReactElement {
  return (
    <>
      {[0, 1, 2, 3].map((k) => {
        const i = props.desde + k;
        const ch = props.codigo[i] ?? '';
        return (
          <View
            key={i}
            flex={1}
            minWidth={0}
            height={54}
            alignItems="center"
            justifyContent="center"
            borderRadius={radii[1]}
            style={estiloCaja(ch, i === props.codigo.length, props.error)}
          >
            <MText size="xl2" weight="extraBold" fontVariant={['tabular-nums']}>
              {ch}
            </MText>
          </View>
        );
      })}
    </>
  );
}

export function CodigoCajas(props: {
  codigo: string;
  onCodigo: (v: string) => void;
  error: boolean;
  label: string;
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={5} aria-hidden={false}>
      <Cajas desde={0} codigo={props.codigo} error={props.error} />
      <MText size="xl2" weight="extraBold" color={colors.gray600} aria-hidden>
        ·
      </MText>
      <Cajas desde={4} codigo={props.codigo} error={props.error} />
      <TamaguiInput
        {...SIN_MARCO}
        testID="activation-code"
        aria-label={props.label}
        aria-invalid={props.error}
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.02}
        caretHidden
        value={props.codigo}
        onChangeText={(v: string) => props.onCodigo(sanitizeCode(v))}
        maxLength={ACTIVATION_CODE_LENGTH + 4}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
      />
    </View>
  );
}
