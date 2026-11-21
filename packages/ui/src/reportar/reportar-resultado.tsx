/**
 * What the sheet says once «Enviar» was pressed (RpHoja «Enviado» and «Sin
 * internet»; the limit, the full queue and a failure are said in the same
 * frame, in plain words): Don, one paragraph and «Listo». The title is the
 * sheet's own (`tituloDe`).
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { MAX_QUEUED_REPORTS, type ReportResult } from '@xangarro/application';
import { Btn, Don, MText, type DonPose } from '../components/index';
import { useTranslation } from '../i18n/index';
import { borderWidths, colors, shapeRadii } from '../theme';

const POSE: Readonly<Record<ReportResult, DonPose>> = {
  sent: 'celebrando',
  queued: 'ayuda',
  queue_full: 'ayuda',
  limited: 'ayuda',
  failed: 'preocupado',
};

const KEY: Readonly<Record<ReportResult, string>> = {
  sent: 'enviado',
  queued: 'guardado',
  queue_full: 'colaLlena',
  limited: 'limite',
  failed: 'fallo',
};

function PorEnviar({ count }: { count: number }): ReactElement {
  const { t } = useTranslation();
  const label =
    count === 1 ? t('reportar.filaPorEnviarUno') : t('reportar.filaPorEnviarVarios', { count });
  return (
    <View
      testID="reportar-por-enviar"
      role="status"
      alignSelf="center"
      flexDirection="row"
      alignItems="center"
      gap={6}
      height={32}
      paddingHorizontal={12}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.quiet}
      borderColor={colors.warningText}
      backgroundColor={colors.warningSoft}
    >
      <View width={8} height={8} borderRadius={shapeRadii.pill} backgroundColor={colors.warning} />
      <MText size="sm" weight="extraBold" color={colors.warningText}>
        {label}
      </MText>
    </View>
  );
}

export function tituloDe(
  result: ReportResult,
  nombre: string | null,
  t: (key: string, vars?: Record<string, unknown>) => string,
): string {
  if (result !== 'sent') return t(`reportar.${KEY[result]}Titulo`);
  const primero = nombre?.trim().split(/\s+/)[0];
  return primero
    ? t('reportar.enviadoTitulo', { nombre: primero })
    : t('reportar.enviadoTituloSinNombre');
}

export function ReportarResultado(props: {
  readonly result: ReportResult;
  readonly nombre: string | null;
  readonly porEnviar: number;
}): ReactElement {
  const { t } = useTranslation();
  const { result } = props;
  return (
    <View testID={`reportar-resultado-${result}`} alignItems="stretch" gap={12}>
      <View alignItems="center">
        <Don pose={POSE[result]} size={result === 'sent' ? 132 : 112} />
      </View>
      <MText size="body" weight="semibold" color={colors.ink} textAlign="center">
        {t(`reportar.${KEY[result]}Texto`, { max: MAX_QUEUED_REPORTS })}
      </MText>
      {result === 'queued' && props.porEnviar > 0 ? <PorEnviar count={props.porEnviar} /> : null}
    </View>
  );
}

export function ResultadoFoot(props: {
  readonly result: ReportResult;
  readonly onListo: () => void;
  readonly onReintentar: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <View gap={10}>
      {props.result === 'failed' ? (
        <Btn
          variant="primary"
          size="lg"
          fullWidth
          sentence
          onPress={props.onReintentar}
          testID="reportar-reintentar"
        >
          {t('reportar.reintentar')}
        </Btn>
      ) : null}
      <Btn
        variant={props.result === 'failed' ? 'quiet' : 'primary'}
        size="lg"
        fullWidth
        sentence
        onPress={props.onListo}
        testID="reportar-listo"
      >
        {t('reportar.listo')}
      </Btn>
    </View>
  );
}
