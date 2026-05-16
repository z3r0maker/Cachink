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
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        <View flex={1} gap={2}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold.toString()}
            fontSize={16}
            color={colors.black}
          >
            {sale.concepto}
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontSize={13}
            color={colors.gray600}
          >
            {`${sale.hora ?? ''} · ${sale.metodo}`}
          </Text>
        </View>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black.toString()}
          fontSize={18}
          color={isCancelled ? colors.red : colors.black}
        >
          {formatMoney(sale.monto)}
        </Text>
      </View>

      {isCancelled && sale.cancelMotivo && (
        <View
          backgroundColor={colors.redSoft}
          borderRadius={radii[0]}
          padding={8}
        >
          <Text
            fontFamily={typography.fontFamily}
            fontSize={12}
            color={colors.red}
          >
            {`🔴 Cancelada · ${sale.cancelMotivo}`}
          </Text>
        </View>
      )}

      {!isCancelled && props.onCancel && (
        <Pressable
          onPress={props.onCancel}
          testID={`cancel-btn-${sale.id}`}
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
      )}
    </View>
  );
}
