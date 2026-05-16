/**
 * Spinner — branded Cachink loading indicator (mobile variant).
 *
 * Uses Lottie animations:
 *   - `sm` → coin-spin.json (24×24, inline in buttons)
 *   - `md` → coin-spin.json (40×40, inline in cards)
 *   - `lg` → coin-stack.json (80×80, section loading)
 *   - `xl` → coin-stack.json (120×120, full-screen overlay)
 */
import type { ReactElement } from 'react';
import LottieView from 'lottie-react-native';
import { View } from '@tamagui/core';
import coinSpin from '../../assets/animations/coin-spin.json';
import coinStack from '../../assets/animations/coin-stack.json';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps {
  readonly size?: SpinnerSize;
  readonly testID?: string;
}

const SIZES: Record<SpinnerSize, number> = { sm: 24, md: 40, lg: 80, xl: 120 };

export function Spinner(props: SpinnerProps): ReactElement {
  const size = props.size ?? 'md';
  const dim = SIZES[size];
  const source = size === 'lg' || size === 'xl' ? coinStack : coinSpin;
  return (
    <View
      testID={props.testID ?? 'spinner'}
      width={dim}
      height={dim}
      alignItems="center"
      justifyContent="center"
    >
      <LottieView
        source={source}
        autoPlay
        loop
        resizeMode="cover"
        style={{ width: dim, height: dim }}
      />
    </View>
  );
}
