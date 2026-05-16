/**
 * EmptyCartHint — zero-training onboarding affordance (Enhancement E).
 *
 * Shown instead of CartStrip when the cart is empty. Disappears the
 * moment the first item is added — zero clutter for experienced users.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Icon } from '../../components/Icon/index';
import { colors, typography } from '../../theme';

export interface EmptyCartHintProps {
  /** Custom hint text — defaults to ventas hint. */
  readonly hint?: string;
  readonly testID?: string;
}

export function EmptyCartHint(props: EmptyCartHintProps): ReactElement {
  const hint = props.hint ?? 'Toca un producto para agregarlo';
  return (
    <View
      testID={props.testID ?? 'empty-cart-hint'}
      alignItems="center"
      justifyContent="center"
      paddingVertical={32}
      gap={8}
    >
      <Icon name="plus" size={28} color={colors.gray400} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={colors.gray400}
        textAlign="center"
      >
        {hint}
      </Text>
    </View>
  );
}
