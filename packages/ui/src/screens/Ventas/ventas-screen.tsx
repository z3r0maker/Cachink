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
import { Btn, Card, Input, SectionTitle } from '../../components/index';
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
  return (
    <Card testID="ventas-error" padding="md" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={18}
        color={colors.red}
      >
        {title}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={colors.gray600}
        marginTop={6}
        marginBottom={12}
      >
        {body}
      </Text>
      <Btn variant="danger" onPress={onRetry} testID="ventas-retry">
        {retryLabel}
      </Btn>
    </Card>
  );
}

function SkeletonRow({ index }: { index: number }): ReactElement {
  return (
    <Card testID={`ventas-skeleton-${index}`} padding="md" fullWidth>
      <View height={16} backgroundColor={colors.gray100} borderRadius={4} />
      <View
        height={16}
        backgroundColor={colors.gray100}
        borderRadius={4}
        marginTop={8}
        width="60%"
      />
    </Card>
  );
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
    <View gap={10}>
      {props.ventas.map((venta) => (
        <VentaCard key={venta.id} venta={venta} onPress={() => props.onVentaPress?.(venta)} />
      ))}
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
      <Input
        type="date"
        label={t('ventas.fechaLabel')}
        value={props.fecha}
        onChange={props.onChangeFecha}
        testID="ventas-fecha"
      />
      <TotalCard label={t('ventas.totalDelDia')} total={props.total} />
      <VentasContent {...props} />
    </View>
  );
}
