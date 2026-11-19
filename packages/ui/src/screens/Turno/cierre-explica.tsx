/**
 * «Explica la diferencia» (Track M, M-09): the four reasons the board lists,
 * as chips, and the note «Otra razón» asks for: the words los patrones
 * read beside the corte (M-16).
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { colors } from '@xangarro/tokens';
import {
  MOTIVOS_DIFERENCIA,
  NOTA_AVISO,
  NOTA_TITULO,
  type MotivoDiferencia,
} from '@xangarro/caja/cierre';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderWidths, fontFace, portalFontSizes, radii, typography } from '../../theme';

/** The note «Otra razón» asks for, with the warning that travels with it. */
function Nota(p: { readonly nota: string; readonly onNota: (t: string) => void }): ReactElement {
  const entrada = {
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: borderWidths.thin,
    borderColor: colors.black,
    borderRadius: radii[3],
    backgroundColor: colors.white,
    ...fontFace(typography.weights.semibold),
    fontSize: portalFontSizes.body,
    color: colors.black,
  } as const;
  return (
    <View gap={6}>
      <Eyebrow>{NOTA_TITULO}</Eyebrow>
      <TextInput
        autoCorrect={false}
        testID="cierre-nota"
        aria-label={NOTA_TITULO}
        placeholder="Cuéntales qué pasó"
        placeholderTextColor={colors.gray600}
        value={p.nota}
        onChangeText={p.onNota}
        style={entrada}
      />
      <MText size="xs" weight="semibold" color={colors.gray600}>
        {NOTA_AVISO}
      </MText>
    </View>
  );
}

/** «Explica la diferencia»: the four reasons, and the note «Otra razón» asks for. */
export function Explica(p: {
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
      {p.motivo === 'Otra razón' ? <Nota nota={p.nota} onNota={p.onNota} /> : null}
    </View>
  );
}
