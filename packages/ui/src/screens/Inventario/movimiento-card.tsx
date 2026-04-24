/**
 * MovimientoCard — one row in the Movimientos list.
 *
 * Shows producto name (resolved by parent via ID lookup), tipo Tag
 * (entrada green / salida red), cantidad (signed), motivo, fecha.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatDate } from '@cachink/domain';
import type { InventoryMovement, Product } from '@cachink/domain';
import { Card, Tag } from '../../components/index';
import { colors, typography } from '../../theme';

export interface MovimientoCardProps {
  readonly movimiento: InventoryMovement;
  readonly producto: Product | null;
  readonly testID?: string;
}

function MovInfo({
  movimiento,
  producto,
}: {
  movimiento: InventoryMovement;
  producto: Product | null;
}): ReactElement {
  const isEntrada = movimiento.tipo === 'entrada';
  return (
    <View flex={1} paddingRight={12}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={15}
        color={colors.black}
      >
        {producto?.nombre ?? movimiento.productoId}
      </Text>
      <View flexDirection="row" gap={6} marginTop={4} flexWrap="wrap">
        <Tag variant={isEntrada ? 'success' : 'danger'}>{movimiento.tipo}</Tag>
        <Tag variant="neutral">{movimiento.motivo}</Tag>
      </View>
    </View>
  );
}

function MovAmount({ movimiento }: { movimiento: InventoryMovement }): ReactElement {
  const isEntrada = movimiento.tipo === 'entrada';
  const sign = isEntrada ? '+' : '−';
  return (
    <View alignItems="flex-end" gap={2}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={20}
        color={isEntrada ? colors.green : colors.red}
      >
        {sign}
        {movimiento.cantidad}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={11}
        color={colors.gray600}
      >
        {formatDate(movimiento.fecha)}
      </Text>
    </View>
  );
}

export function MovimientoCard(props: MovimientoCardProps): ReactElement {
  return (
    <Card testID={props.testID ?? `movimiento-${props.movimiento.id}`} padding="md" fullWidth>
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        <MovInfo movimiento={props.movimiento} producto={props.producto} />
        <MovAmount movimiento={props.movimiento} />
      </View>
    </Card>
  );
}
