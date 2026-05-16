/**
 * Spinner — branded Cachink loading indicator (web/desktop variant).
 *
 * Uses a CSS-animated rotating dollar-sign icon as a lightweight
 * fallback (no Lottie dependency on web builds).
 */
import { useEffect, useRef, type ReactElement } from 'react';
import { Animated, Easing } from 'react-native';
import { View } from '@tamagui/core';
import { Icon } from '../Icon/index';
import { colors } from '../../theme';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps {
  readonly size?: SpinnerSize;
  readonly testID?: string;
}

const SIZES: Record<SpinnerSize, number> = { sm: 24, md: 40, lg: 80, xl: 120 };

export function Spinner(props: SpinnerProps): ReactElement {
  const size = props.size ?? 'md';
  const dim = SIZES[size];
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      testID={props.testID ?? 'spinner'}
      width={dim}
      height={dim}
      alignItems="center"
      justifyContent="center"
    >
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Icon name="dollar-sign" size={dim * 0.6} color={colors.yellow} />
      </Animated.View>
    </View>
  );
}
