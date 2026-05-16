/**
 * DigitBox — single masked digit cell for PinCodeInput.
 *
 * Shows a filled dot (●), a blinking cursor, or nothing depending on state.
 */

import type { ReactElement } from 'react';
import { View, Text } from '@tamagui/core';
import { colors, radii, typography } from '../../theme';
import { BlinkingCursor } from './blinking-cursor';

const BOX_SIZE = 44;
const BOX_HEIGHT = 48;
const BORDER = 2;
const BORDER_ACTIVE = 2.5;
const DOT_SIZE = 24;
const RADIUS = radii[2]; // 12

function resolveBorder(error: boolean, active: boolean): { color: string; width: number } {
  const color = error ? colors.red : active ? colors.black : colors.gray200;
  const width = active && !error ? BORDER_ACTIVE : BORDER;
  return { color, width };
}

export function DigitBox(props: {
  readonly filled: boolean;
  readonly active: boolean;
  readonly error: boolean;
}): ReactElement {
  const border = resolveBorder(props.error, props.active);
  const bg = props.active && !props.filled ? colors.yellowSoft : colors.white;
  const content = props.filled
    ? <Text fontSize={DOT_SIZE} color={colors.black} fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} lineHeight={DOT_SIZE}>●</Text>
    : props.active
      ? <BlinkingCursor />
      : null;

  return (
    <View width={BOX_SIZE} height={BOX_HEIGHT} borderColor={border.color} borderWidth={border.width} borderRadius={RADIUS} backgroundColor={bg} alignItems="center" justifyContent="center" borderStyle="solid">
      {content}
    </View>
  );
}
