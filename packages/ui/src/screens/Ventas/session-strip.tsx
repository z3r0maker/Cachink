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
import { colors, fontSizes, typography } from '../../theme';
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
      fontSize={fontSizes.xs}
      color={colors.gray600}
      numberOfLines={1}
    >
      {props.sale.concepto} · {formatMoney(props.sale.monto)}
    </Text>
  );
}

function CollapsedHeader(props: { total: Money }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="center">
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.xs}
        color={colors.black}
        letterSpacing={typography.letterSpacing.wide}
        style={{ textTransform: 'uppercase' }}
      >
        Total del día
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={fontSizes.xl2}
        color={colors.black}
        letterSpacing={typography.letterSpacing.tight}
      >
        {formatMoney(props.total)}
      </Text>
    </View>
  );
}

function CollapsedFooter(props: { ventaCount: number; lastVenta?: Sale }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="center">
      <View flexDirection="row" gap={4} flex={1}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={fontSizes.xs}
          color={colors.gray600}
        >
          {props.ventaCount} venta{props.ventaCount !== 1 ? 's' : ''}
        </Text>
        {props.lastVenta && (
          <>
            <Text fontSize={fontSizes.xs} color={colors.textMuted}>
              ·
            </Text>
            <LastSalePreview sale={props.lastVenta} />
          </>
        )}
      </View>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={fontSizes.xs}
        color={colors.black}
      >
        Ver más ▼
      </Text>
    </View>
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
        <CollapsedHeader total={props.total} />
        <CollapsedFooter ventaCount={props.ventaCount} lastVenta={props.lastVenta} />
      </View>
    </Card>
  );
}

function ExpandedHeader(props: { total: Money; onCollapse: () => void }): ReactElement {
  return (
    <Card
      variant="yellow"
      padding="md"
      fullWidth
      onPress={() => {
        impactLight();
        props.onCollapse();
      }}
      testID="session-strip-expanded-header"
      ariaLabel="Ocultar ventas del día"
    >
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={fontSizes.xl2}
          color={colors.black}
        >
          {formatMoney(props.total)}
        </Text>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.semibold}
          fontSize={fontSizes.xs}
          color={colors.black}
        >
          Ocultar ▲
        </Text>
      </View>
    </Card>
  );
}

export function SessionStrip(props: SessionStripProps): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const testID = props.testID ?? 'session-strip';

  if (!expanded) {
    return (
      <View testID={testID}>
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
    <View testID={testID} gap={8}>
      <ExpandedHeader total={props.total} onCollapse={() => setExpanded(false)} />
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
