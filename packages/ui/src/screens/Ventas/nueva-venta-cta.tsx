/**
 * NuevaVentaCta — the "start a sale" affordance on VentasScreen
 * (review item #8).
 *
 * The feedback was that the Ventas tab read as a *report* of sales
 * rather than the place you make one: a title, a total, then a grid of
 * products with no visible starting point. Someone opening the app for
 * the first time had no idea the grid was tappable.
 *
 * So we say it out loud. One unmistakable primary button labelled
 * "Nueva venta" sits above the product grid; tapping it focuses the
 * product search so the very next keystroke is progress. It is a
 * signpost, not a mode — the grid stays tappable exactly as before,
 * which is the faster path once the user knows it exists.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Icon } from '../../components/index';
import { colors, fontSizes, typography } from '../../theme';

export interface NuevaVentaCtaProps {
  readonly label: string;
  readonly hint: string;
  readonly onPress: () => void;
  readonly testID?: string;
}

export function NuevaVentaCta(props: NuevaVentaCtaProps): ReactElement {
  return (
    <View gap={6}>
      <Btn
        variant="primary"
        size="lg"
        fullWidth
        onPress={props.onPress}
        testID={props.testID ?? 'ventas-nueva-venta-cta'}
        icon={<Icon name="plus" size={20} color={colors.white} />}
      >
        {props.label}
      </Btn>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.sm}
        color={colors.gray600}
        textAlign="center"
      >
        {props.hint}
      </Text>
    </View>
  );
}
