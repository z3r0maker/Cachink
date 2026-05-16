/**
 * SessionStrip — collapsible "Total del día" summary that replaces
 * the old full SalesPane on the Ventas screen.
 *
 * Collapsed (default): yellow card with total + last-sale preview.
 * Expanded: full scrollable sales list using existing VentaRowSlot +
 * SwipeableRow composition.
 */
import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Sale, Money } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Card } from '../../components/Card/index';
import { colors, typography } from '../../theme';
import { impactLight } from '../../haptics/index';
import { SalesContent } from './ventas-sales-pane';

export interface SessionStripProps {
  readonly total: Money;
  readonly ventaCount: number;
  readonly lastVenta?: Sale;
  readonly ventas: readonly Sale[];
  readonly productColorMap?: ReadonlyMap<string, string>;
  readonly onVentaPress?: (v: Sale) => void;
  readonly onEditVenta?: (v: Sale) => void;
  readonly onEliminarVenta?: (v: Sale) => void;
  readonly loading?: boolean;
  readonly error?: Error | null;
  readonly onRetry?: () => void;
  readonly testID?: string;
}

function LastSalePreview(props: { sale: Sale }): ReactElement {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={12}
      color={colors.gray600}
      numberOfLines={1}
    >
      {props.sale.concepto} · {formatMoney(props.sale.monto)}
    </Text>
  );
}

function CollapsedCard(props: {
  total: Money;
  ventaCount: number;
  lastVenta?: Sale;
  onExpand: () => void;
}): ReactElement {
  return (
    <Card
      variant="yellow"
      padding="md"
      fullWidth
      onPress={() => {
        impactLight();
        props.onExpand();
      }}
      testID="session-strip-collapsed"
      ariaLabel="Ver ventas del día"
    >
      <View gap={4}>
        <View flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={11}
            color={colors.black}
            letterSpacing={typography.letterSpacing.wide}
            style={{ textTransform: 'uppercase' }}
          >
            Total del día
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.black}
            fontSize={20}
            color={colors.black}
            letterSpacing={typography.letterSpacing.tight}
          >
            {formatMoney(props.total)}
          </Text>
        </View>
        <View flexDirection="row" justifyContent="space-between" alignItems="center">
          <View flexDirection="row" gap={4} flex={1}>
            <Text
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.medium}
              fontSize={12}
              color={colors.gray600}
            >
              {props.ventaCount} venta{props.ventaCount !== 1 ? 's' : ''}
            </Text>
            {props.lastVenta && (
              <>
                <Text fontSize={12} color={colors.gray400}>·</Text>
                <LastSalePreview sale={props.lastVenta} />
              </>
            )}
          </View>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.semibold}
            fontSize={12}
            color={colors.black}
          >
            Ver más ▼
          </Text>
        </View>
      </View>
    </Card>
  );
}

export function SessionStrip(props: SessionStripProps): ReactElement {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <View testID={props.testID ?? 'session-strip'}>
        <CollapsedCard
          total={props.total}
          ventaCount={props.ventaCount}
          lastVenta={props.lastVenta}
          onExpand={() => setExpanded(true)}
        />
      </View>
    );
  }

  return (
    <View testID={props.testID ?? 'session-strip'} gap={8}>
      <Card
        variant="yellow"
        padding="md"
        fullWidth
        onPress={() => {
          impactLight();
          setExpanded(false);
        }}
        testID="session-strip-expanded-header"
        ariaLabel="Ocultar ventas del día"
      >
        <View flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.black}
            fontSize={20}
            color={colors.black}
          >
            {formatMoney(props.total)}
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.semibold}
            fontSize={12}
            color={colors.black}
          >
            Ocultar ▲
          </Text>
        </View>
      </Card>
      <SalesContent
        ventas={props.ventas}
        productColorMap={props.productColorMap}
        loading={props.loading}
        error={props.error}
        onRetry={props.onRetry}
        onVentaPress={props.onVentaPress}
        onEditVenta={props.onEditVenta}
        onEliminarVenta={props.onEliminarVenta}
      />
    </View>
  );
}
