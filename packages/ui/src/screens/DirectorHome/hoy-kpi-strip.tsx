/**
 * HoyKpiStrip — Director Home cards for "Ventas hoy" + "Egresos hoy"
 * (P1C-M10-T02, S4-C3).
 *
 * Wraps `useVentasByDate(today)` + `useEgresosByDate(today)` and
 * renders two Kpi cards inside a 2-column responsive group. Tapping
 * either card routes to the matching tab.
 */

import { useMemo, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { IsoDate, Money } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Btn, Card, Kpi } from '../../components/index';
import type { KpiTone } from '../../components/Kpi/kpi';
import {
  totalDelDia,
  totalEgresosDelDia,
  useEgresosByDate,
  useVentasByDate,
} from '../../hooks/index';
import { useTranslation } from '../../i18n/index';

export interface HoyKpiStripProps {
  readonly onVerVentas?: () => void;
  readonly onVerEgresos?: () => void;
  readonly testID?: string;
  /** Inject a specific date for testing; defaults to today UTC. */
  readonly now?: Date;
}

export function todayIso(now: Date = new Date()): IsoDate {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

interface HoyCardProps {
  readonly label: string;
  readonly total: Money;
  readonly tone: KpiTone;
  readonly testID: string;
  readonly verLabel: string;
  readonly verTestID: string;
  readonly onVer?: () => void;
}

function HoyCard(props: HoyCardProps): ReactElement {
  return (
    <View flexGrow={1} flexBasis={220} minWidth={200}>
      <Card padding="md" fullWidth testID={props.testID}>
        <Kpi label={props.label} value={formatMoney(props.total)} tone={props.tone} />
        {props.onVer && (
          <View marginTop={10}>
            <Btn variant="ghost" size="sm" onPress={props.onVer} testID={props.verTestID}>
              {props.verLabel}
            </Btn>
          </View>
        )}
      </Card>
    </View>
  );
}

export function HoyKpiStrip(props: HoyKpiStripProps): ReactElement {
  const { t } = useTranslation();
  const today = useMemo(() => todayIso(props.now), [props.now]);
  const ventasQ = useVentasByDate(today);
  const egresosQ = useEgresosByDate(today);
  const ventasTotal = totalDelDia(ventasQ.data ?? []);
  const egresosTotal = totalEgresosDelDia(egresosQ.data ?? []);

  return (
    <View flexDirection="row" gap={12} flexWrap="wrap" testID={props.testID ?? 'hoy-kpi-strip'}>
      <HoyCard
        label={t('directorHome.ventasHoy')}
        total={ventasTotal}
        tone="positive"
        testID="hoy-kpi-ventas"
        verLabel={t('directorHome.verVentas')}
        verTestID="hoy-kpi-ventas-ver"
        onVer={props.onVerVentas}
      />
      <HoyCard
        label={t('directorHome.egresosHoy')}
        total={egresosTotal}
        tone={(egresosTotal as bigint) > 0n ? 'negative' : 'neutral'}
        testID="hoy-kpi-egresos"
        verLabel={t('directorHome.verEgresos')}
        verTestID="hoy-kpi-egresos-ver"
        onVer={props.onVerEgresos}
      />
    </View>
  );
}
