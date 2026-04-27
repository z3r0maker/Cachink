/**
 * UtilidadHero — the Director Home's top hero card (P1C-M10-T01, S4-C2).
 *
 * Wraps `useEstadoResultados({ periodo: currentMonthRange() })` and
 * renders a `Kpi` showing utilidad neta with positive / negative tone.
 * Tapping "Ver estados" calls `onVerEstados` — the Director Home route
 * wires this to `/estados`.
 *
 * Domain-side: utilidad neta can be positive (green tone), negative
 * (red tone), or zero (neutral). Empty month (no ventas + no egresos)
 * renders utilidad = 0.
 */

import { useMemo, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { IsoDate } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Btn, Card, Kpi } from '../../components/index';
import { useEstadoResultados } from '../../hooks/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface UtilidadHeroProps {
  readonly onVerEstados?: () => void;
  readonly testID?: string;
  /** Inject a specific date for testing; defaults to today UTC. */
  readonly now?: Date;
}

export function currentMonthRange(now: Date = new Date()): {
  from: IsoDate;
  to: IsoDate;
} {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${y}-${m}-01` as IsoDate,
    to: `${y}-${m}-${String(lastDay).padStart(2, '0')}` as IsoDate,
  };
}

function utilidadTone(utilidad: bigint): 'positive' | 'negative' | 'neutral' {
  if (utilidad > 0n) return 'positive';
  if (utilidad < 0n) return 'negative';
  return 'neutral';
}

export function UtilidadHero(props: UtilidadHeroProps): ReactElement {
  const { t } = useTranslation();
  const periodo = useMemo(() => currentMonthRange(props.now), [props.now]);
  const query = useEstadoResultados({ periodo });
  const utilidad = (query.data?.utilidadNeta ?? 0n) as bigint;

  return (
    <Card testID={props.testID ?? 'utilidad-hero'} variant="yellow" padding="lg" fullWidth>
      <Kpi
        label={t('directorHome.utilidadTitle')}
        value={formatMoney(utilidad as never)}
        tone={utilidadTone(utilidad)}
      />
      <View marginTop={12} flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={12}
          color={colors.gray600}
        >
          {periodo.from} → {periodo.to}
        </Text>
        {props.onVerEstados && (
          <Btn
            variant="dark"
            size="sm"
            onPress={props.onVerEstados}
            testID="utilidad-hero-ver-estados"
          >
            {t('directorHome.utilidadVerEstados')}
          </Btn>
        )}
      </View>
    </Card>
  );
}
