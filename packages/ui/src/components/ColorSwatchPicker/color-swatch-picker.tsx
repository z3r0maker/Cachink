/**
 * ColorSwatchPicker — horizontal row of tappable color circles.
 *
 * Renders 8 soft-tone swatches for ProductColor selection. The
 * selected swatch gets the neobrutalist bold border (2px solid
 * black); unselected ones get a 1px gray200 border.
 *
 * Cross-platform: pure composition, no `.native.tsx` split needed.
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { ProductColor } from '@cachink/domain';
import { PRODUCT_COLOR_OPTIONS } from '../../product-colors';
import { colors, fontSizes, typography } from '../../theme';

export interface ColorSwatchPickerProps {
  readonly label: string;
  readonly value: ProductColor;
  readonly onChange: (color: ProductColor) => void;
  readonly testID?: string;
}

const SWATCH_SIZE = 28;
const SWATCH_RADIUS = SWATCH_SIZE / 2;

function Swatch({
  hex,
  selected,
  onPress,
  testID,
}: {
  hex: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}): ReactElement {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      style={{
        width: SWATCH_SIZE,
        height: SWATCH_SIZE,
        borderRadius: SWATCH_RADIUS,
        backgroundColor: hex,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.black : colors.gray200,
      }}
    />
  );
}

export function ColorSwatchPicker(props: ColorSwatchPickerProps): ReactElement {
  return (
    <View gap={6} testID={props.testID ?? 'color-swatch-picker'}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={fontSizes.md}
        color={colors.ink}
      >
        {props.label}
      </Text>
      <View flexDirection="row" gap={8} flexWrap="wrap">
        {PRODUCT_COLOR_OPTIONS.map((opt) => (
          <Swatch
            key={opt.key}
            hex={opt.hex}
            selected={props.value === opt.key}
            onPress={() => props.onChange(opt.key)}
            testID={`swatch-${opt.key}`}
          />
        ))}
      </View>
    </View>
  );
}
