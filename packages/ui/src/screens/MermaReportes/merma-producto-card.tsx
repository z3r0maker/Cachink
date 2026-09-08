/**
 * MermaProductoCard — per-product summary of merma movements.
 * Shows product name, total units lost, and a breakdown of events.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { InventoryMovement } from '@cachink/domain';
import { Card } from '../../components/index';
import { colors, fontSizes, typography } from '../../theme';

export interface MermaProductoCardProps {
  readonly productoNombre: string;
  readonly totalUnidades: number;
  readonly movimientos: readonly InventoryMovement[];
  readonly testID?: string;
}

function MermaMovRow(props: { m: InventoryMovement }): ReactElement {
  const { m } = props;
  return (
    <View flexDirection="row" justifyContent="space-between" paddingLeft={8}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.regular}
        fontSize={fontSizes.xs}
        color={colors.gray600}
      >
        {m.fecha} — {m.nota ?? m.motivo}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.xs}
        color={colors.textMuted}
      >
        -{m.cantidad}
      </Text>
    </View>
  );
}

function CardHeader(props: { nombre: string; total: number }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="center">
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.lg}
        color={colors.black}
        flex={1}
        numberOfLines={1}
      >
        {props.nombre}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={fontSizes.lg}
        color={colors.redText}
      >
        -{props.total}
      </Text>
    </View>
  );
}

export function MermaProductoCard(props: MermaProductoCardProps): ReactElement {
  return (
    <Card testID={props.testID ?? 'merma-producto-card'} padding="md" fullWidth>
      <View gap={6}>
        <CardHeader nombre={props.productoNombre} total={props.totalUnidades} />
        {props.movimientos.map((m) => (
          <MermaMovRow key={m.id} m={m} />
        ))}
      </View>
    </Card>
  );
}
