/**
 * NumpadDisplay — large money display above the numpad.
 *
 * Shows the current entered amount formatted as MXN currency.
 * Used in checkout efectivo and caja deposit/withdraw flows.
 */

import type { ReactElement } from 'react';
import { View, Text } from '@tamagui/core';
import { colors, fontSizes, radii, typography } from '../../theme';

export interface NumpadDisplayProps {
  /** Display text, e.g. "$500.00" */
  readonly value: string;
  readonly testID?: string;
}

export function NumpadDisplay(props: NumpadDisplayProps): ReactElement {
  return (
    <View
      backgroundColor={colors.gray100}
      borderRadius={radii[2]}
      borderWidth={2}
      borderColor={colors.black}
      paddingVertical={16}
      paddingHorizontal={20}
      alignItems="center"
      testID={props.testID ?? 'numpad-display'}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black.toString()}
        fontSize={fontSizes.xl6}
        color={colors.black}
        numberOfLines={1}
      >
        {props.value}
      </Text>
    </View>
  );
}
