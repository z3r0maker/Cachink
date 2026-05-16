/**
 * StickyFooter — sticky bottom CTA for CheckoutEfectivo.
 *
 * Renders "Registrar $X" with a check icon, pinned to the bottom
 * of the screen so it's always reachable on small phones where
 * the numpad scrolls.
 *
 * Split from checkout-efectivo.tsx to stay under the 200-line cap.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@cachink/domain';
import { Btn } from '../../components/Btn/btn';
import { Icon } from '../../components/Icon/index';
import { colors } from '../../theme';

export interface CheckoutFooterProps {
  readonly totalCentavos: Money;
  readonly canSubmit: boolean;
  readonly submitting: boolean;
  readonly onConfirm: () => void;
}

export function CheckoutFooter(
  props: CheckoutFooterProps,
): ReactElement {
  return (
    <View
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      backgroundColor={colors.offwhite}
      paddingHorizontal={20}
      paddingVertical={16}
      borderTopWidth={2}
      borderTopColor={colors.gray200}
    >
      <Btn
        variant="green"
        fullWidth
        size="lg"
        icon={<Icon name="check" size={18} color={colors.white} />}
        onPress={props.onConfirm}
        disabled={!props.canSubmit}
        loading={props.submitting}
        testID="checkout-efectivo-submit"
      >
        {`Registrar ${formatMoney(props.totalCentavos)}`}
      </Btn>
    </View>
  );
}
