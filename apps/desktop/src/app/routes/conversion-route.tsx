/**
 * Desktop route adapter for /conversion.
 * Phase 18.
 */

import type { ReactElement } from 'react';
import { ConversionScreen } from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';

export function ConversionRoute(): ReactElement {
  return (
    <DesktopAppShellWrapper activeTabKey="otros">
      <ConversionScreen testID="desktop-conversion-screen" />
    </DesktopAppShellWrapper>
  );
}
