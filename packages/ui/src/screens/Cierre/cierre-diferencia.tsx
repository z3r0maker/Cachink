/**
 * «Diferencia» (MvCierre): Cuadra, Falta or Sobra with the amount, what it
 * means (Don worried beside a shortfall; he tells what happened, never what
 * to do about the business), and with a difference the motive
 * (`MOTIVOS_DIFERENCIA`) and, for «Otra razón», the note to the owner.
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { conSigno, DIF, MOTIVOS_DIFERENCIA } from '@xangarro/caja/cierre';
import { Chip, Eyebrow, MText } from '../../components/index';
import { DonBurbuja } from '../../components/Don/don-burbuja';
import { borderWidths, colors, portalFontSizes, radii, typography } from '../../theme';
import type { ConteoCierre } from './use-conteo-cierre';

const NOTA = {
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

function Motivos({ x, dueno }: { x: ConteoCierre; dueno: string }): ReactElement {
  return (
    <View gap={8}>
      <Eyebrow color={colors.ink}>Explica la diferencia</Eyebrow>
      <View
        role="radiogroup"
        aria-label="Explica la diferencia"
        flexDirection="row"
        flexWrap="wrap"
        gap={8}
      >
        {MOTIVOS_DIFERENCIA.map((m) => (
          <Chip
            key={m}
            label={m}
            marked
            selected={x.motivo === m}
            onPress={() => x.setMotivo(m)}
            testID={`cierre-motivo-${MOTIVOS_DIFERENCIA.indexOf(m)}`}
          />
        ))}
      </View>
      {x.motivo === 'Otra razón' ? (
        <View gap={6}>
          <MText size="md" weight="extraBold">{`Nota para ${dueno}`}</MText>
          <TextInput
            testID="cierre-nota"
            aria-label={`Nota para ${dueno}`}
            placeholder="Cuéntale qué pasó"
            placeholderTextColor={colors.textMuted}
            value={x.nota}
            onChangeText={x.setNota}
            maxLength={500}
            style={NOTA}
          />
        </View>
      ) : null}
    </View>
  );
}

export function Diferencia({ x, dueno }: { x: ConteoCierre; dueno: string }): ReactElement {
  const t = DIF[x.dif.tipo];
  return (
    <View
      role="region"
      aria-label="Diferencia"
      testID={`cierre-diferencia-${x.dif.tipo}`}
      backgroundColor={t.bg}
      borderWidth={borderWidths.thick}
      borderColor={t.color}
      borderRadius={radii[7]}
      paddingHorizontal={16}
      paddingVertical={14}
      gap={12}
    >
      <View flexDirection="row" alignItems="baseline" gap={10}>
        <View flex={1}>
          <Eyebrow color={colors.ink}>Diferencia</Eyebrow>
        </View>
        <MText size="xl4" weight="extraBold" color={t.color} fontVariant={['tabular-nums']}>
          {`${t.label} ${conSigno(x.dif)}`}
        </MText>
      </View>
      {x.dif.tipo === 'falta' ? (
        <DonBurbuja pose="preocupado" size={72} cola="centro">
          <MText size="body" weight="extraBold">
            {t.hint}
          </MText>
        </DonBurbuja>
      ) : (
        <MText size="md" weight="semibold" color={colors.ink}>
          {t.hint}
        </MText>
      )}
      {x.dif.tipo === 'cuadra' ? null : <Motivos x={x} dueno={dueno} />}
    </View>
  );
}
