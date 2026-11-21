/**
 * The report form (RpHoja «¿Qué pasó?», RpTableta): Don and one line saying
 * nothing has to be typed, the four cards, an optional sentence, what travels
 * with the report, and the two actions.
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import type { BugReportCategory } from '@xangarro/domain';
import { MAX_BUG_DESCRIPTION } from '@xangarro/contracts';
import { Btn, Don, GLYPHS, MText, PathIcon } from '../components/index';
import { useTranslation } from '../i18n/index';
import { borderWidths, colors, portalFontSizes, radii, typography } from '../theme';
import { ReportarOpciones } from './reportar-opciones';

export interface FormularioState {
  readonly category: BugReportCategory;
  readonly description: string;
}

const INPUT = {
  minHeight: 64,
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
  fontFamily: typography.fontFamily,
  fontSize: portalFontSizes.body,
  color: colors.black,
  textAlignVertical: 'top',
} as const;

function QueVa(): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" alignItems="flex-start" gap={8}>
      <PathIcon d={GLYPHS.check} size={16} strokeWidth={2.6} color={colors.greenText} />
      <MText flex={1} size="sm" weight="semibold" color={colors.gray600}>
        {t('reportar.queVa')}
      </MText>
    </View>
  );
}

/** The optional sentence: a label and a two-line field. */
function Mas(props: {
  readonly value: string;
  readonly onChange: (v: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <View gap={6}>
      <MText size="md" weight="extraBold" nativeID="reportar-mas-label">
        {t('reportar.masLabel')}
      </MText>
      <TextInput
        testID="reportar-mas"
        aria-labelledby="reportar-mas-label"
        accessibilityLabel={t('reportar.masLabel')}
        placeholder={t('reportar.masPlaceholder')}
        placeholderTextColor={colors.gray600}
        multiline
        maxLength={MAX_BUG_DESCRIPTION}
        value={props.value}
        onChangeText={props.onChange}
        style={INPUT}
      />
    </View>
  );
}

export function ReportarFormulario(props: {
  readonly value: FormularioState;
  readonly onChange: (next: FormularioState) => void;
  readonly enFila?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const { value, onChange } = props;
  return (
    <View testID="reportar-formulario" gap={12}>
      <View flexDirection="row" alignItems="center" gap={10}>
        <Don pose="ayuda" size={68} />
        <MText flex={1} size="md" weight="semibold" color={colors.gray600}>
          {t('reportar.subtitulo')}
        </MText>
      </View>
      <ReportarOpciones
        value={value.category}
        onChange={(category) => onChange({ ...value, category })}
        enFila={props.enFila}
      />
      <Mas
        value={value.description}
        onChange={(description) => onChange({ ...value, description })}
      />
      <QueVa />
    </View>
  );
}

export function FormularioFoot(props: {
  readonly enviando: boolean;
  readonly onEnviar: () => void;
  readonly onCancelar: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <View gap={10}>
      <Btn
        variant="primary"
        size="lg"
        fullWidth
        sentence
        onPress={props.onEnviar}
        disabled={props.enviando}
        loading={props.enviando}
        testID="reportar-enviar"
      >
        {props.enviando ? t('reportar.enviando') : t('reportar.enviar')}
      </Btn>
      <Btn
        variant="quiet"
        size="lg"
        fullWidth
        sentence
        onPress={props.onCancelar}
        disabled={props.enviando}
        testID="reportar-cancelar"
      >
        {t('reportar.cancelar')}
      </Btn>
    </View>
  );
}
