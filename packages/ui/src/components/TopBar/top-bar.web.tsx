import type { ReactElement } from 'react';
import { TopBarFrame, type TopBarProps } from './top-bar.shared';

export function TopBar(props: TopBarProps): ReactElement {
  return <TopBarFrame {...props} />;
}
