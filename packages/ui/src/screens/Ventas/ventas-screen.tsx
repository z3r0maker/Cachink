/**
 * VentasScreen — list view with date filter + "Total del día" card +
 * per-venta rows (P1C-M3-T01).
 *
 * Pure presentation. Data + loading / error states + handlers are all
 * props so every screen state is testable without async harness.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Sale } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import type { Money } from '@cachink/domain';
import {
  Btn,
  Card,
  ErrorState,
  FAB,
  Icon,
  List,
  SectionTitle,
  Skeleton,
  SwipeableRow,
} from '../../components/index';
import { DateField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { VentaCard } from './venta-card';
import { EmptyVentas } from './empty-ventas';

export interface VentasScreenProps {
  readonly fecha: string;
  readonly onChangeFecha: (fecha: string) => void;
  readonly ventas: readonly Sale[];
  readonly total: Money;
  readonly onNuevaVenta: () => void;
  readonly onVentaPress?: (venta: Sale) => void;
  readonly loading?: boolean;
  readonly error?: Error | null;
  readonly onRetry?: () => void;
  readonly testID?: string;
  /**
   * Audit 4.6 — when `true` the screen mounts a `<FAB>` for the
   * primary action so phone users can reach it one-handed. The
   * top-right `<Btn>` in `<SectionTitle>` stays for desktop. Mobile
   * shells pass `showFab` to opt in; desktop shells leave it
   * unset / `false`.
   */
  readonly showFab?: boolean;
  /**
   * Audit Round 2 K1 — when supplied, each row is wrapped in a
   * `<SwipeableRow>` whose left swipe fires `onEditVenta(venta)` and
   * right swipe fires `onEliminarVenta(venta)`. The accessible
   * tap-into-detail handler (`onVentaPress`) keeps the non-gesture
   * fallback per ADR-022's rule: swipe is a magnifier, never the only
   * entry point.
   */
  readonly onEditVenta?: (venta: Sale) => void;
  /**
   * Audit Round 2 K1 — destructive companion to `onEditVenta`. Routes
   * typically open a `<ConfirmDialog>` here and call `useEliminarVenta`
   * on confirmation.
   */
  readonly onEliminarVenta?: (venta: Sale) => void;
}

interface TotalCardProps {
  readonly label: string;
  readonly total: Money;
}

function TotalCard({ label, total }: TotalCardProps): ReactElement {
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

function ErrorBanner({
  title,
  body,
  retryLabel,
  onRetry,
}: {
  title: string;
  body: string;
  retryLabel: string;
  onRetry: () => void;
}): ReactElement {
  // Audit M-1 PR 5 (audit 6.5) — delegates to the shared
  // `<ErrorState>` primitive. Screen-scoped testIDs preserved so
  // existing E2E selectors keep working.
  return (
    <ErrorState
      title={title}
      body={body}
      retryLabel={retryLabel}
      onRetry={onRetry}
      testID="ventas-error"
      retryTestID="ventas-retry"
    />
  );
}

function SkeletonRow({ index }: { index: number }): ReactElement {
  // Audit M-1 PR 5 (audit 6.4) — delegates to the shared
  // `<Skeleton.Row>` primitive. Screen-scoped testID preserved.
  return <Skeleton.Row index={index} testIDPrefix="ventas-skeleton" />;
}

function VentasContent(props: VentasScreenProps): ReactElement {
  const { t } = useTranslation();
  if (props.error) {
    return (
      <ErrorBanner
        title={t('ventas.errorTitle')}
        body={t('ventas.errorBody')}
        retryLabel={t('ventas.retryLabel')}
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
  if (props.ventas.length === 0) {
    return <EmptyVentas onNuevaVenta={props.onNuevaVenta} />;
  }
  return (
    <List<Sale>
      data={props.ventas}
      keyExtractor={(venta) => venta.id}
      renderItem={(venta) => <VentaRowSlot venta={venta} {...props} />}
      testID="ventas-list"
    />
  );
}

/**
 * Audit Round 2 K1 — wraps a `VentaCard` in a `<SwipeableRow>` when
 * the parent route provides edit / delete handlers. Without them the
 * row renders unchanged so legacy mounts (web target, screens that
 * haven't opted in yet) keep working.
 */
function VentaRowSlot({
  venta,
  onVentaPress,
  onEditVenta,
  onEliminarVenta,
}: { venta: Sale } & VentasScreenProps): ReactElement {
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

export function VentasScreen(props: VentasScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID={props.testID ?? 'ventas-screen'}
      flex={1}
      padding={16}
      gap={12}
      backgroundColor={colors.offwhite}
    >
      <SectionTitle
        title={t('ventas.title')}
        action={
          <Btn variant="primary" onPress={props.onNuevaVenta} testID="ventas-nueva">
            {t('ventas.newCta')}
          </Btn>
        }
      />
      {/*
       * Audit 4.5 — TotalCard moves above the date filter. With the
       * keyboard popped on a phone, the previous `<SectionTitle> +
       * date input + total` order pushed the day-total below the fold.
       * The total is the most-checked KPI on this screen; it should
       * be the first thing visible after the screen header.
       */}
      <TotalCard label={t('ventas.totalDelDia')} total={props.total} />
      <DateField
        label={t('ventas.fechaLabel')}
        value={props.fecha}
        onChange={props.onChangeFecha}
        testID="ventas-fecha"
      />
      <VentasContent {...props} />
      {props.showFab === true && (
        <FAB
          icon={<Icon name="plus" size={28} color={colors.black} />}
          ariaLabel={t('ventas.newCta')}
          onPress={props.onNuevaVenta}
          testID="ventas-fab"
        />
      )}
    </View>
  );
}
