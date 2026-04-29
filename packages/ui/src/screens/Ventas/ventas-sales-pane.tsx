/**
 * Sales-pane sub-components for VentasScreen — extracted to respect
 * the 200-line file budget (CLAUDE.md §4.4).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Sale } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import type { Money } from '@cachink/domain';
import {
  Card,
  ErrorState,
  List,
  Skeleton,
  SwipeableRow,
} from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { VentaCard } from './venta-card';

// ---------------------------------------------------------------------------
// TotalCard
// ---------------------------------------------------------------------------

export function TotalCard({ label, total }: { label: string; total: Money }): ReactElement {
  return (
    <Card testID="ventas-total-card" variant="yellow" padding="md" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        letterSpacing={typography.letterSpacing.wide}
        color={colors.black}
        style={{ textTransform: 'uppercase' }}
      >
        {label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={32}
        color={colors.black}
        letterSpacing={typography.letterSpacing.tighter}
      >
        {formatMoney(total)}
      </Text>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// VentaRowSlot
// ---------------------------------------------------------------------------

export function VentaRowSlot({
  venta,
  onVentaPress,
  onEditVenta,
  onEliminarVenta,
}: {
  venta: Sale;
  onVentaPress?: (v: Sale) => void;
  onEditVenta?: (v: Sale) => void;
  onEliminarVenta?: (v: Sale) => void;
}): ReactElement {
  const card = <VentaCard venta={venta} onPress={() => onVentaPress?.(venta)} />;
  const swipeEnabled = onEditVenta !== undefined || onEliminarVenta !== undefined;
  if (!swipeEnabled) {
    return <View marginBottom={10}>{card}</View>;
  }
  return (
    <View marginBottom={10}>
      <SwipeableRow
        onSwipeLeft={onEditVenta ? () => onEditVenta(venta) : undefined}
        onSwipeRight={onEliminarVenta ? () => onEliminarVenta(venta) : undefined}
        testID={`venta-swipe-${venta.id}`}
      >
        {card}
      </SwipeableRow>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SalesContent
// ---------------------------------------------------------------------------

export interface SalesContentProps {
  readonly ventas: readonly Sale[];
  readonly loading?: boolean;
  readonly error?: Error | null;
  readonly onRetry?: () => void;
  readonly onVentaPress?: (venta: Sale) => void;
  readonly onEditVenta?: (venta: Sale) => void;
  readonly onEliminarVenta?: (venta: Sale) => void;
}

export function SalesContent(props: SalesContentProps): ReactElement {
  const { t } = useTranslation();
  if (props.error) {
    return (
      <ErrorState
        title={t('ventas.errorTitle')}
        body={t('ventas.errorBody')}
        retryLabel={t('ventas.retryLabel')}
        onRetry={props.onRetry ?? (() => {})}
        testID="ventas-error"
        retryTestID="ventas-retry"
      />
    );
  }
  if (props.loading === true) {
    return (
      <View gap={10}>
        <Skeleton.Row index={0} testIDPrefix="ventas-skeleton" />
        <Skeleton.Row index={1} testIDPrefix="ventas-skeleton" />
        <Skeleton.Row index={2} testIDPrefix="ventas-skeleton" />
      </View>
    );
  }
  if (props.ventas.length === 0) {
    return (
      <View padding={16} alignItems="center">
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={14}
          color={colors.gray400}
        >
          {t('ventas.emptyTitle')}
        </Text>
      </View>
    );
  }
  return (
    <List<Sale>
      data={props.ventas}
      keyExtractor={(venta) => venta.id}
      renderItem={(venta) => (
        <VentaRowSlot
          venta={venta}
          onVentaPress={props.onVentaPress}
          onEditVenta={props.onEditVenta}
          onEliminarVenta={props.onEliminarVenta}
        />
      )}
      testID="ventas-list"
    />
  );
}
