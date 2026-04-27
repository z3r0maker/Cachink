/**
 * SwipeableRow — web / Tauri variant.
 *
 * Vite-based tools resolve this file via the default import chain
 * `./swipeable-row.tsx → ./swipeable-row.web.tsx`. Metro ignores it
 * and picks `./swipeable-row.native.tsx` on mobile.
 *
 * **What this variant does NOT do:** desktop has no swipe gesture — the
 * native equivalent of a swipe is a right-click context menu, which is
 * a separate primitive (a future `<RowMenu>` could wrap the same row
 * shape). For now the web variant is a deliberate passthrough that
 * renders the children verbatim, with a wrapping `<View>` that
 * forwards the same `testID` + `aria-label` as the native variant so
 * tests + accessibility tooling see the same DOM shape across
 * platforms.
 *
 * Suppressing swipe behaviour on web is intentional, not a TODO. The
 * audit's 3.6 + 3.7 findings established that swipe is **never** the
 * only way to reach the action; the tap-to-detail / long-press-menu
 * fallback that the row composes with is the desktop affordance.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { SwipeableRowProps } from './swipeable-row';

export function SwipeableRow(props: SwipeableRowProps): ReactElement {
  return (
    <View testID={props.testID ?? 'swipeable-row'} aria-label={props.ariaLabel}>
      {props.children}
    </View>
  );
}
