import type { ReactElement } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBarFrame, type TopBarProps } from './top-bar.shared';

export function TopBar(props: TopBarProps): ReactElement {
  const insets = useSafeAreaInsets();

  return <TopBarFrame {...props} paddingTop={insets.top} />;
}
