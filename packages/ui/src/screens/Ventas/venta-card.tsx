/**
 * VentaCard — one row in the Ventas list.
 *
 * Displays concepto + categoria Tag + cliente chip (if set) + monto + metodo
 * in the canonical Cachink Card look. Tapping (if `onPress` is provided)
 * fires the parent's detail-popover / share flow.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Sale } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Card, Tag } from '../../components/index';
import { colors, fontSizes, typography } from '../../theme';

export interface VentaCardProps {
  readonly venta: Sale;
  /** When provided, shows the client name as a chip (for Crédito sales). */
  readonly clienteName?: string;
  /** Product background color hex — mirrors the ProductoCard tile color. */
  readonly backgroundColor?: string;
  readonly onPress?: () => void;
  readonly testID?: string;
}

function MetodoTag({ metodo }: { metodo: Sale['metodo'] }): ReactElement {
  const variant = metodo === 'Crédito' ? 'warning' : 'info';
  return <Tag variant={variant}>{metodo}</Tag>;
}

function VentaInfo({ venta, clienteName }: { venta: Sale; clienteName?: string }): ReactElement {
  return (
    <View flex={1} paddingRight={12}>
      <View flexDirection="row" alignItems="center" gap={6}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={fontSizes.lg}
          color={colors.black}
        >
          {venta.concepto}
        </Text>
        {venta.hora !== undefined && venta.hora !== null && (
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.medium}
            fontSize={fontSizes.xs}
            color={colors.gray600}
          >
            {venta.hora}
          </Text>
        )}
      </View>
      <View flexDirection="row" gap={6} marginTop={6}>
        <Tag variant="soft">{venta.categoria}</Tag>
        <MetodoTag metodo={venta.metodo} />
        {clienteName !== undefined && <Tag variant="info">{clienteName}</Tag>}
      </View>
    </View>
  );
}

export function VentaCard(props: VentaCardProps): ReactElement {
  const montoColor = props.venta.estadoPago === 'pendiente' ? colors.warningText : colors.black;
  return (
    <Card
      testID={props.testID ?? `venta-card-${props.venta.id}`}
      padding="md"
      onPress={props.onPress}
      fullWidth
      backgroundColor={props.backgroundColor}
    >
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <VentaInfo venta={props.venta} clienteName={props.clienteName} />
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={fontSizes.xl2}
          color={montoColor}
        >
          {formatMoney(props.venta.monto)}
        </Text>
      </View>
    </Card>
  );
}
