/**
 * CambioCard — displays change amount + optional cash-insufficient
 * warning in the CheckoutEfectivo screen.
 *
 * Split from checkout-efectivo.tsx to stay under the 200-line cap.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney, type Money } from '@cachink/domain';
import { Icon } from '../../components/Icon/index';
import { colors, fontSizes, radii, typography } from '../../theme';

export interface CambioCardProps {
  readonly cambio: Money;
  readonly visible: boolean;
  readonly showCashWarning: boolean;
}

function CambioRow(props: { cambio: Money }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" justifyContent="space-between">
      <View flexDirection="row" alignItems="center" gap={8}>
        <Icon name="hand-coins" size={22} color={colors.greenText} />
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.semibold.toString()}
          fontSize={fontSizes.lg}
          color={colors.greenText}
        >
          Cambio
        </Text>
      </View>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black.toString()}
        fontSize={fontSizes.xl2}
        color={colors.greenText}
      >
        {formatMoney(props.cambio)}
      </Text>
    </View>
  );
}

export function CambioCard(props: CambioCardProps): ReactElement {
  if (!props.visible) return <View height={48} />;

  return (
    <View
      backgroundColor={colors.greenSoft}
      borderRadius={radii[3]}
      borderWidth={2}
      borderColor={colors.green}
      paddingVertical={14}
      paddingHorizontal={20}
      width="100%"
      gap={10}
    >
      <CambioRow cambio={props.cambio} />
      {props.showCashWarning && <CashWarning />}
    </View>
  );
}

function CashWarning(): ReactElement {
  return (
    <View
      backgroundColor={colors.warningSoft}
      borderRadius={radii[2]}
      borderWidth={2}
      borderColor={colors.warning}
      paddingVertical={8}
      paddingHorizontal={12}
    >
      <View flexDirection="row" alignItems="center" gap={8}>
        <Icon name="circle-alert" size={16} color={colors.warningText} />
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.semibold.toString()}
          fontSize={fontSizes.sm}
          color={colors.warningText}
        >
          Tu caja podría no tener suficiente cambio
        </Text>
      </View>
    </View>
  );
}
