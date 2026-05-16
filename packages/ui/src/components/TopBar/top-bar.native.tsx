import type { ReactElement } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBarFrame, type TopBarProps } from './top-bar.shared';

/**
 * Extra spacing added beyond `insets.top` so the TopBar content never
 * touches the system status bar. On non-notched iPhones (SE, 8)
 * `insets.top` ≈ 20 px — only a few pixels clear of the clock/battery
 * text. Adding 8 px eliminates the visual overlap on every device.
 */
const STATUS_BAR_BUFFER = 8;

export function TopBar(props: TopBarProps): ReactElement {
  const insets = useSafeAreaInsets();

  return <TopBarFrame {...props} paddingTop={insets.top + STATUS_BAR_BUFFER} />;
}
