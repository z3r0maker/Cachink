/**
 * BlinkingCursor — animated pipe character for PinCodeInput active box.
 *
 * Pulses opacity 0↔1 at 400ms intervals using React Native Animated API.
 */

import { useRef, useEffect, type ReactElement } from 'react';
import { Animated, Easing } from 'react-native';
import { Text } from '@tamagui/core';
import { colors, typography } from '../../theme';

const CURSOR_FONT_SIZE = 24;
const CURSOR_LINE_HEIGHT = 28;
const BLINK_DURATION = 400;

export function BlinkingCursor(): ReactElement {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: BLINK_DURATION,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: BLINK_DURATION,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <Text
        fontSize={CURSOR_FONT_SIZE}
        color={colors.black}
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        lineHeight={CURSOR_LINE_HEIGHT}
      >
        |
      </Text>
    </Animated.View>
  );
}
