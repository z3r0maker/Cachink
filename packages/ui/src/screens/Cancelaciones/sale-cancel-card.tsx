/**
 * SaleCancelCard — sale card in the Cancelaciones list.
 *
 * Shows sale details + a "Cancelar" button for active sales, or
 * a "Cancelada" badge with cancellation details for cancelled ones.
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import { formatMoney, type Sale } from '@cachink/domain';
import { colors, radii, typography } from '../../theme';

export interface SaleCancelCardProps {
  readonly sale: Sale;
  readonly onCancel?: () => void;
  readonly testID?: string;
}

function SaleHeader(props: {
  sale: Sale;
  isCancelled: boolean;
}): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="center">
      <View flex={1} gap={2}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold.toString()}
          fontSize={16}
          color={colors.black}
        >
          {props.sale.concepto}
        </Text>
        <Text
          fontFamily={typography.fontFamily}
          fontSize={13}
          color={colors.gray600}
        >
          {`${props.sale.hora ?? ''} · ${props.sale.metodo}`}
        </Text>
      </View>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black.toString()}
        fontSize={18}
        color={props.isCancelled ? colors.red : colors.black}
      >
        {formatMoney(props.sale.monto)}
      </Text>
    </View>
  );
}

function CancelBadge(props: { motivo: string }): ReactElement {
  return (
    <View backgroundColor={colors.redSoft} borderRadius={radii[0]} padding={8}>
      <Text fontFamily={typography.fontFamily} fontSize={12} color={colors.red}>
        {`🔴 Cancelada · ${props.motivo}`}
      </Text>
    </View>
  );
}

function CancelButton(props: {
  saleId: string;
  onCancel: () => void;
}): ReactElement {
  return (
    <Pressable
      onPress={props.onCancel}
      testID={`cancel-btn-${props.saleId}`}
      accessibilityRole="button"
      accessibilityLabel="Cancelar venta"
    >
      <View
        backgroundColor={colors.redSoft}
        borderRadius={radii[0]}
        paddingVertical={8}
        paddingHorizontal={12}
        alignSelf="flex-end"
      >
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold.toString()}
          fontSize={14}
          color={colors.red}
        >
          Cancelar
        </Text>
      </View>
    </Pressable>
  );
}

export function SaleCancelCard(
  props: SaleCancelCardProps,
): ReactElement {
  const { sale } = props;
  const isCancelled = sale.cancelledAt !== null || sale.deletedAt !== null;

  return (
    <View
      backgroundColor={colors.white}
      borderRadius={radii[2]}
      borderWidth={2}
      borderColor={isCancelled ? colors.red : colors.black}
      padding={14}
      gap={6}
      opacity={isCancelled ? 0.7 : 1}
      testID={props.testID}
    >
      <SaleHeader sale={sale} isCancelled={isCancelled} />
      {isCancelled && sale.cancelMotivo && (
        <CancelBadge motivo={sale.cancelMotivo} />
      )}
      {!isCancelled && props.onCancel && (
        <CancelButton saleId={sale.id} onCancel={props.onCancel} />
      )}
    </View>
  );
}
