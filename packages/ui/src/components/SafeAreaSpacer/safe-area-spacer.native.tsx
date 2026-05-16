/**
 * SafeAreaSpacer — React Native variant.
 *
 * Renders an invisible `<View>` whose height matches the safe-area
 * inset for the requested edge **plus a visual buffer** so content
 * never touches the system chrome. Use at the top of full-bleed
 * screens (RolePicker, Wizard, BusinessForm) so content doesn't
 * collide with the iOS status bar or the home indicator.
 *
 * Metro auto-picks this file on mobile via `.native.tsx` resolution.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SafeAreaSpacerProps } from './safe-area-spacer';

/**
 * Extra spacing beyond the raw inset so gate-screen content never
 * touches the system status bar or home indicator. Matches the
 * `STATUS_BAR_BUFFER` in `top-bar.native.tsx` for visual consistency.
 */
const EDGE_BUFFER = 8;

export function SafeAreaSpacer(props: SafeAreaSpacerProps): ReactElement {
  const insets = useSafeAreaInsets();
  const edge = props.edge ?? 'top';
  const size = (edge === 'top' ? insets.top : insets.bottom) + EDGE_BUFFER;
  return <View height={size} />;
}
