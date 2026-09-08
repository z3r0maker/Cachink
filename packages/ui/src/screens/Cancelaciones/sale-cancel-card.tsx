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
import { colors, fontSizes, radii, typography } from '../../theme';
import { useTranslation } from '../../i18n/index';

export interface SaleCancelCardProps {
  readonly sale: Sale;
  readonly onCancel?: () => void;
  readonly testID?: string;
}

function SaleHeader(props: { sale: Sale; isCancelled: boolean }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="center">
      <View flex={1} gap={2}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold.toString()}
          fontSize={fontSizes.lg}
          color={colors.black}
        >
          {props.sale.concepto}
        </Text>
        <Text fontFamily={typography.fontFamily} fontSize={fontSizes.sm} color={colors.gray600}>
          {`${props.sale.hora ?? ''} · ${props.sale.metodo}`}
        </Text>
      </View>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black.toString()}
        fontSize={fontSizes.xl}
        color={props.isCancelled ? colors.redText : colors.black}
      >
        {formatMoney(props.sale.monto)}
      </Text>
    </View>
  );
}

function CancelBadge(props: { motivo: string }): ReactElement {
  return (
    <View backgroundColor={colors.redSoft} borderRadius={radii[0]} padding={8}>
      <Text fontFamily={typography.fontFamily} fontSize={fontSizes.xs} color={colors.redText}>
        {`🔴 Cancelada · ${props.motivo}`}
      </Text>
    </View>
  );
}

function CancelButton(props: { saleId: string; onCancel: () => void }): ReactElement {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={props.onCancel}
      testID={`cancel-btn-${props.saleId}`}
      role="button"
      aria-label={t('cancelaciones.cancelSaleAriaLabel')}
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
          fontSize={fontSizes.md}
          color={colors.redText}
        >
          {t('cancelaciones.cancelSale')}
        </Text>
      </View>
    </Pressable>
  );
}

export function SaleCancelCard(props: SaleCancelCardProps): ReactElement {
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
      {isCancelled && sale.cancelMotivo && <CancelBadge motivo={sale.cancelMotivo} />}
      {!isCancelled && props.onCancel && (
        <CancelButton saleId={sale.id} onCancel={props.onCancel} />
      )}
    </View>
  );
}
