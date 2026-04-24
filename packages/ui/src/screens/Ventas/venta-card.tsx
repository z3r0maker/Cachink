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
import { colors, typography } from '../../theme';

export interface VentaCardProps {
  readonly venta: Sale;
  readonly onPress?: () => void;
  readonly testID?: string;
}

function MetodoTag({ metodo }: { metodo: Sale['metodo'] }): ReactElement {
  const variant = metodo === 'Crédito' ? 'warning' : 'neutral';
  return <Tag variant={variant}>{metodo}</Tag>;
}

export function VentaCard(props: VentaCardProps): ReactElement {
  return (
    <Card
      testID={props.testID ?? `venta-card-${props.venta.id}`}
      padding="md"
      onPress={props.onPress}
      fullWidth
    >
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <View flex={1} paddingRight={12}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={16}
            color={colors.black}
          >
            {props.venta.concepto}
          </Text>
          <View flexDirection="row" gap={6} marginTop={6}>
            <Tag>{props.venta.categoria}</Tag>
            <MetodoTag metodo={props.venta.metodo} />
          </View>
        </View>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={20}
          color={props.venta.estadoPago === 'pendiente' ? colors.warning : colors.black}
        >
          {formatMoney(props.venta.monto)}
        </Text>
      </View>
    </Card>
  );
}
