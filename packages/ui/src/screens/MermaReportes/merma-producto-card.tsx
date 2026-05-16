/**
 * MermaProductoCard — per-product summary of merma movements.
 * Shows product name, total units lost, and a breakdown of events.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { InventoryMovement } from '@cachink/domain';
import { Card } from '../../components/index';
import { colors, typography } from '../../theme';

export interface MermaProductoCardProps {
  readonly productoNombre: string;
  readonly totalUnidades: number;
  readonly movimientos: readonly InventoryMovement[];
  readonly testID?: string;
}

export function MermaProductoCard(props: MermaProductoCardProps): ReactElement {
  return (
    <Card testID={props.testID ?? 'merma-producto-card'} padding="md" fullWidth>
      <View gap={6}>
        <View flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={15}
            color={colors.black}
            flex={1}
            numberOfLines={1}
          >
            {props.productoNombre}
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.black}
            fontSize={16}
            color={colors.red}
          >
            -{props.totalUnidades}
          </Text>
        </View>
        {props.movimientos.map((m) => (
          <View
            key={m.id}
            flexDirection="row"
            justifyContent="space-between"
            paddingLeft={8}
          >
            <Text
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.regular}
              fontSize={12}
              color={colors.gray600}
            >
              {m.fecha} — {m.nota ?? m.motivo}
            </Text>
            <Text
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.medium}
              fontSize={12}
              color={colors.gray400}
            >
              -{m.cantidad}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
