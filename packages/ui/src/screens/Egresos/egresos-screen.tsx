/**
 * EgresosScreen — list view with date filter, "Total de egresos" card,
 * per-egreso cards, skeleton + error + empty states (P1C-M4-T01).
 *
 * Mirror of VentasScreen's API — same hooks pattern, same states, same
 * props shape. Kept independent so the two screens can evolve without
 * cross-pollination.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { Expense, Money } from '@cachink/domain';
import { Btn, Input, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { EgresoCard } from './egreso-card';
import { EmptyEgresos } from './empty-egresos';
import { ErrorBanner, SkeletonRow, TotalCard } from './egresos-states';

export interface EgresosScreenProps {
  readonly fecha: string;
  readonly onChangeFecha: (fecha: string) => void;
  readonly egresos: readonly Expense[];
  readonly total: Money;
  readonly onNuevoEgreso: () => void;
  readonly onEgresoPress?: (egreso: Expense) => void;
  readonly loading?: boolean;
  readonly error?: Error | null;
  readonly onRetry?: () => void;
  readonly testID?: string;
}

function EgresosContent(props: EgresosScreenProps): ReactElement {
  const { t } = useTranslation();
  if (props.error) {
    return (
      <ErrorBanner
        title={t('egresos.errorTitle')}
        body={t('egresos.errorBody')}
        retryLabel={t('egresos.retryLabel')}
        onRetry={props.onRetry ?? (() => {})}
      />
    );
  }
  if (props.loading === true) {
    return (
      <View gap={10}>
        <SkeletonRow index={0} />
        <SkeletonRow index={1} />
        <SkeletonRow index={2} />
      </View>
    );
  }
  if (props.egresos.length === 0) {
    return <EmptyEgresos onNuevoEgreso={props.onNuevoEgreso} />;
  }
  return (
    <View gap={10}>
      {props.egresos.map((egreso) => (
        <EgresoCard key={egreso.id} egreso={egreso} onPress={() => props.onEgresoPress?.(egreso)} />
      ))}
    </View>
  );
}

export function EgresosScreen(props: EgresosScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID={props.testID ?? 'egresos-screen'}
      flex={1}
      padding={16}
      gap={12}
      backgroundColor={colors.offwhite}
    >
      <SectionTitle
        title={t('egresos.title')}
        action={
          <Btn variant="primary" onPress={props.onNuevoEgreso} testID="egresos-nuevo">
            {t('egresos.newCta')}
          </Btn>
        }
      />
      <Input
        type="date"
        label={t('egresos.fechaLabel')}
        value={props.fecha}
        onChange={props.onChangeFecha}
        testID="egresos-fecha"
      />
      <TotalCard label={t('egresos.totalDelDia')} total={props.total} />
      <EgresosContent {...props} />
    </View>
  );
}
