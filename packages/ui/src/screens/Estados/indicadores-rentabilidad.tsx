/** RentabilidadSection — margin KPI cards for Indicadores screen. */

import type { ReactElement } from 'react';
import { Text } from '@tamagui/core';
import type { Indicadores } from '@cachink/domain';
import { SectionTitle } from '../../components/index';
import type { useTranslation } from '../../i18n/index';
import { colors, fontSizes } from '../../theme';
import type { MarginTrend } from '../../hooks/use-indicadores-trend';
import { MarginCard } from './indicadores-cards';
import { type HealthTones, healthVerdict, MARGIN_ZONES } from './indicadores-sections';

type T = ReturnType<typeof useTranslation>['t'];

export interface RentabilidadProps {
  readonly i: Indicadores | null;
  readonly pi?: Indicadores | null;
  readonly trend?: MarginTrend | null;
  readonly tones: HealthTones;
  readonly t: T;
}

function nullableMargin(i: Indicadores | null, key: keyof Indicadores): number | null {
  return i?.[key] ?? null;
}

function MargenBrutoCard(props: RentabilidadProps): ReactElement {
  const { i, pi, tones, t } = props;
  return (
    <MarginCard
      label={t('estados.indicadoresMargenBruto')}
      subtitle={t('estados.indicadoresMargenBrutoSubtitle')}
      detail={t('estados.indicadoresMargenBrutoDetail')}
      value={nullableMargin(i, 'margenBruto')}
      trend={props.trend?.margenBruto}
      zones={MARGIN_ZONES.bruto}
      healthVerdict={healthVerdict(tones.mb, 'MargenBruto', t)}
      healthTone={tones.mb}
      priorValue={pi?.margenBruto}
      testID="indicador-margen-bruto"
      t={t}
    />
  );
}

function MargenOperativoCard(props: RentabilidadProps): ReactElement {
  const { i, pi, tones, t } = props;
  return (
    <MarginCard
      label={t('estados.indicadoresMargenOperativo')}
      subtitle={t('estados.indicadoresMargenOperativoSubtitle')}
      detail={t('estados.indicadoresMargenOperativoDetail')}
      value={nullableMargin(i, 'margenOperativo')}
      trend={props.trend?.margenOperativo}
      zones={MARGIN_ZONES.operativo}
      healthVerdict={healthVerdict(tones.mo, 'MargenOperativo', t)}
      healthTone={tones.mo}
      priorValue={pi?.margenOperativo}
      testID="indicador-margen-operativo"
      t={t}
    />
  );
}

function MargenNetoCard(props: RentabilidadProps): ReactElement {
  const { i, pi, tones, t } = props;
  return (
    <MarginCard
      label={t('estados.indicadoresMargenNeto')}
      subtitle={t('estados.indicadoresMargenNetoSubtitle')}
      detail={t('estados.indicadoresMargenNetoDetail')}
      value={nullableMargin(i, 'margenNeto')}
      trend={props.trend?.margenNeto}
      zones={MARGIN_ZONES.neto}
      healthVerdict={healthVerdict(tones.mn, 'MargenNeto', t)}
      healthTone={tones.mn}
      priorValue={pi?.margenNeto}
      testID="indicador-margen-neto"
      t={t}
    />
  );
}

export function RentabilidadSection(props: RentabilidadProps): ReactElement {
  const { t } = props;
  return (
    <>
      <SectionTitle title={t('estados.indicadoresRentabilidadTitle')} />
      <Text
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontSize={fontSizes.xs}
        color={colors.gray600}
      >
        {t('estados.indicadoresRentabilidadSubtitle')}
      </Text>
      <MargenBrutoCard {...props} />
      <MargenOperativoCard {...props} />
      <MargenNetoCard {...props} />
    </>
  );
}
