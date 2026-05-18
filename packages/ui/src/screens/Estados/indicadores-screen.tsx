import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { DEFAULT_HEALTH_THRESHOLDS, type HealthThresholds, type Indicadores } from '@cachink/domain';
import { SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import type { MarginTrend } from '../../hooks/use-indicadores-trend';
import {
  computeHealthTones,
  RentabilidadSection,
  SaludSection,
  ThresholdDisclosure,
} from './indicadores-sections';

export interface IndicadoresScreenProps {
  readonly indicadores: Indicadores | null;
  readonly periodoLabel: string;
  readonly periodoMode?: 'mensual' | 'anual' | 'rango';
  readonly trend?: MarginTrend | null;
  readonly priorIndicadores?: Indicadores | null;
  readonly onOpenSettings?: () => void;
  readonly thresholds?: HealthThresholds;
  readonly testID?: string;
}

function rotacionSuffix(mode: 'mensual' | 'anual' | 'rango' | undefined, t: ReturnType<typeof useTranslation>['t']): string {
  if (mode === 'anual') return t('estados.indicadoresRotacionSufixAnual');
  if (mode === 'mensual') return t('estados.indicadoresRotacionSufixMensual');
  return t('estados.indicadoresRotacionSufixPeriodo');
}

export function IndicadoresScreen(props: IndicadoresScreenProps): ReactElement {
  const { t } = useTranslation();
  const th = props.thresholds ?? DEFAULT_HEALTH_THRESHOLDS;
  const tones = computeHealthTones(props.indicadores, th);
  const nanLabel = t('estados.indicadorNaN');
  const rotSuffix = rotacionSuffix(props.periodoMode, t);
  return (
    <View testID={props.testID ?? 'indicadores-screen'} gap={12}>
      <SectionTitle title={props.periodoLabel} />
      <RentabilidadSection i={props.indicadores} pi={props.priorIndicadores} trend={props.trend} tones={tones} t={t} />
      <SaludSection i={props.indicadores} pi={props.priorIndicadores} tones={tones} rotSuffix={rotSuffix} nanLabel={nanLabel} t={t} />
      <ThresholdDisclosure onOpenSettings={props.onOpenSettings} t={t} />
    </View>
  );
}
