/**
 * SafeAreaSpacer — web / desktop variant (noop).
 *
 * On web/desktop there is no system status bar overlap, so this renders
 * nothing. The native variant (`safe-area-spacer.native.tsx`) adds a
 * `<View>` with `height={useSafeAreaInsets().top}` so full-bleed screens
 * (RolePicker, Wizard, BusinessForm) don't collide with the iOS status bar.
 */
import type { ReactElement } from 'react';

export interface SafeAreaSpacerProps {
  /** Which edge to pad. Default `'top'`. */
  readonly edge?: 'top' | 'bottom';
}

export function SafeAreaSpacer(_props: SafeAreaSpacerProps): ReactElement {
  // Web/desktop: no-op — no system status bar to clear.
  return <></>;
}
