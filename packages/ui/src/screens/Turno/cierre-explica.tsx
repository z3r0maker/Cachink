/**
 * «Explica la diferencia» (Track M, M-09): the four reasons the board lists,
 * as chips, and the note «Otra razón» asks for — the words the owner will
 * read beside the corte.
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { colors } from '@xangarro/tokens';
import { MOTIVOS_DIFERENCIA, type MotivoDiferencia } from '@xangarro/caja/cierre';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderWidths, portalFontSizes, radii, typography } from '../../theme';

/** The note «Otra razón» asks for, with the warning that travels with it. */
function Nota(p: {
  readonly dueno: string;
  readonly nota: string;
  readonly onNota: (t: string) => void;
}): ReactElement {
  const entrada = {
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: borderWidths.thin,
    borderColor: colors.black,
    borderRadius: radii[3],
    backgroundColor: colors.white,
    fontFamily: typography.fontFamily,
    fontWeight: '600',
    fontSize: portalFontSizes.body,
    color: colors.black,
  } as const;
  return (
    <View gap={6}>
      <Eyebrow>{`Nota para ${p.dueno}`}</Eyebrow>
      <TextInput
        testID="cierre-nota"
        aria-label={`Nota para ${p.dueno}`}
        placeholder="Cuéntale qué pasó"
        placeholderTextColor={colors.gray600}
        value={p.nota}
        onChangeText={p.onNota}
        style={entrada}
      />
      <MText size="xs" weight="semibold" color={colors.gray600}>
        {`${p.dueno} va a leer esto junto con el corte. Es mejor una nota corta que un faltante sin explicación.`}
      </MText>
    </View>
  );
}

/** «Explica la diferencia»: the four reasons, and the note «Otra razón» asks for. */
export function Explica(p: {
  readonly dueno: string;
  readonly motivo: MotivoDiferencia | null;
  readonly onMotivo: (m: MotivoDiferencia) => void;
  readonly nota: string;
  readonly onNota: (t: string) => void;
}): ReactElement {
  return (
    <View gap={10}>
      <Eyebrow>Explica la diferencia</Eyebrow>
      <View
        role="radiogroup"
        aria-label="Explica la diferencia"
        flexDirection="row"
        gap={8}
        flexWrap="wrap"
      >
        {MOTIVOS_DIFERENCIA.map((m) => (
          <Chip
            key={m}
            label={m}
            marked
            selected={p.motivo === m}
            onPress={() => p.onMotivo(m)}
            testID={`cierre-motivo-${m}`}
          />
        ))}
      </View>
      {p.motivo === 'Otra razón' ? <Nota dueno={p.dueno} nota={p.nota} onNota={p.onNota} /> : null}
    </View>
  );
}
