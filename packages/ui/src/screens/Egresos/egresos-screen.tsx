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
import { Btn, FAB, Icon, List, SectionTitle, SwipeableRow } from '../../components/index';
import { DateField } from '../../components/fields/index';
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
  /**
   * Audit 4.6 — when `true` the screen mounts a `<FAB>` for the
   * primary action so phone users can reach it one-handed. Mobile
   * shells opt in; desktop continues to use the `<SectionTitle>`
   * top-right Btn.
   */
  readonly showFab?: boolean;
  /** Audit Round 2 K2 — swipe-to-edit handler. */
  readonly onEditEgreso?: (egreso: Expense) => void;
  /** Audit Round 2 K2 — swipe-to-delete handler (route opens ConfirmDialog). */
  readonly onEliminarEgreso?: (egreso: Expense) => void;
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
    <List<Expense>
      data={props.egresos}
      keyExtractor={(egreso) => egreso.id}
      renderItem={(egreso) => <EgresoRowSlot egreso={egreso} {...props} />}
      testID="egresos-list"
    />
  );
}

/** Audit Round 2 K2 — wrap row in SwipeableRow when handlers present. */
function EgresoRowSlot({
  egreso,
  onEgresoPress,
  onEditEgreso,
  onEliminarEgreso,
}: { egreso: Expense } & EgresosScreenProps): ReactElement {
  const card = <EgresoCard egreso={egreso} onPress={() => onEgresoPress?.(egreso)} />;
  const swipeEnabled = onEditEgreso !== undefined || onEliminarEgreso !== undefined;
  if (!swipeEnabled) return <View marginBottom={10}>{card}</View>;
  return (
    <View marginBottom={10}>
      <SwipeableRow
        onSwipeLeft={onEditEgreso ? () => onEditEgreso(egreso) : undefined}
        onSwipeRight={onEliminarEgreso ? () => onEliminarEgreso(egreso) : undefined}
        testID={`egreso-swipe-${egreso.id}`}
      >
        {card}
      </SwipeableRow>
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
      {/* Audit 4.5 — TotalCard above the date filter so the
       * day-total stays above the fold when the keyboard is open. */}
      <TotalCard label={t('egresos.totalDelDia')} total={props.total} />
      <DateField
        label={t('egresos.fechaLabel')}
        value={props.fecha}
        onChange={props.onChangeFecha}
        testID="egresos-fecha"
      />
      <EgresosContent {...props} />
      {props.showFab === true && (
        <FAB
          icon={<Icon name="plus" size={28} color={colors.black} />}
          ariaLabel={t('egresos.newCta')}
          onPress={props.onNuevoEgreso}
          testID="egresos-fab"
        />
      )}
    </View>
  );
}
