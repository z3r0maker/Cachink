/**
 * The cancel dialog's fields (MvCancelarVenta; the web caja's
 * `cancelar-campos.tsx`): the four motives (one required), the optional note
 * for the owner, and the operator's NIP that `CancelarTicketUseCase` checks
 * (the web's O-32 amendment; the board predates it), four digits (ADR-072).
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { PIN_LENGTH } from '@xangarro/domain';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors, portalFontSizes, radii, typography } from '../../theme';

/** The web caja's four motives (apps/web `ventas/cancelar-campos.tsx`), word for word. */
export const MOTIVOS = [
  'El cliente se arrepintió',
  'Me equivoqué al cobrar',
  'Cobré de más',
  'Otra razón',
] as const;
export type Motivo = (typeof MOTIVOS)[number];

const CAMPO = {
  height: 48,
  paddingHorizontal: 14,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
  fontFamily: typography.fontFamily,
  fontWeight: '600',
  fontSize: portalFontSizes.body,
  color: colors.black,
} as const;

function Etiqueta(p: { readonly texto: string; readonly opcional?: string }): ReactElement {
  return (
    <MText size="md" weight="extraBold">
      {p.texto}
      {p.opcional ? (
        <MText size="md" weight="semibold" color={colors.textMuted}>
          {` ${p.opcional}`}
        </MText>
      ) : null}
    </MText>
  );
}

export function Motivos(p: {
  readonly value: Motivo | null;
  readonly onChange: (m: Motivo) => void;
}): ReactElement {
  return (
    <View gap={8}>
      <Etiqueta texto="¿Por qué la cancelas?" />
      <View
        role="radiogroup"
        aria-label="¿Por qué la cancelas?"
        flexDirection="row"
        flexWrap="wrap"
        gap={8}
      >
        {MOTIVOS.map((m, i) => (
          <Chip
            key={m}
            label={m}
            marked
            selected={p.value === m}
            onPress={() => p.onChange(m)}
            testID={`cancelar-motivo-${i}`}
          />
        ))}
      </View>
    </View>
  );
}

export function NotaDueno(p: {
  readonly dueno: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
}): ReactElement {
  return (
    <View gap={6}>
      <Etiqueta texto={`Nota para ${p.dueno}`} opcional="(opcional)" />
      <TextInput
        testID="cancelar-nota"
        aria-label={`Nota para ${p.dueno}, opcional`}
        placeholder="Ej. pidió para llevar y ya no esperó"
        placeholderTextColor={colors.textMuted}
        value={p.value}
        onChangeText={p.onChange}
        maxLength={300}
        style={CAMPO}
      />
    </View>
  );
}

export function NipCampo(p: {
  readonly value: string;
  readonly onChange: (v: string) => void;
}): ReactElement {
  return (
    <View gap={6}>
      <Etiqueta texto="Tu NIP" opcional="(cuatro números)" />
      <TextInput
        testID="cancelar-nip"
        aria-label="Tu NIP, cuatro números"
        value={p.value}
        onChangeText={(v) => p.onChange(v.replace(/\D/g, '').slice(0, PIN_LENGTH))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={PIN_LENGTH}
        autoComplete="off"
        style={{ ...CAMPO, width: 140, letterSpacing: 8, fontWeight: '800' }}
      />
    </View>
  );
}
