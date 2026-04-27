/**
 * `<SplitPane>` — responsive list-left / detail-right primitive.
 *
 * Closes audit finding 4.4: tablet landscape (iPad Pro 11", desktop
 * Tauri webview) wastes the extra horizontal space by mounting the
 * same single-column screens that work for phones. The primitive
 * stacks `left` only on phone widths (`media.sm`) and renders the two
 * children side-by-side at tablet-landscape and bigger
 * (`media.gtMd`). The intermediate `gtSm` range (481–768 px — phone
 * landscape, small tablet portrait) keeps the stacked layout because
 * a 240-pt list-pane + 360-pt detail-pane squeezes inputs and
 * `<Btn>` rows tighter than the touch budget allows.
 *
 * The default split is 40 % / 60 % (left / right) per the audit's
 * Phase 1 recommendation. Callers can override via `leftFlex` /
 * `rightFlex`. The split is rendered as a Tamagui `<View>` row with
 * `flex: 1` flagged on each child — no manual width calculations,
 * no media queries beyond `useMedia()`.
 *
 * **When to use** — list-screen split-list-detail patterns: Director
 * Home (overview vs detail card cluster), Ventas / Egresos /
 * Inventario / Clientes / Movimientos lists (list left, focused
 * detail right). For non-list dashboards that need an n-column grid,
 * use `useMedia()` directly and reach for `<View flexDirection="row"
 * flexWrap="wrap">` — `<SplitPane>` is intentionally limited to two
 * panes.
 *
 * **What it does NOT do**:
 *   - Doesn't add a divider; pages style their own panel borders.
 *   - Doesn't add scroll containers; each pane decides its own
 *     scroll behaviour.
 *   - Doesn't auto-mount the right pane when nothing is selected;
 *     the page passes the right slot it wants (e.g. an empty-state
 *     `<EmptyState>` with "Selecciona un elemento").
 */

import type { ReactElement, ReactNode } from 'react';
import { View, useMedia } from '@tamagui/core';

export interface SplitPaneProps {
  /** List / index pane (rendered first; on phones this is the only pane shown stacked above `right`). */
  readonly left: ReactNode;
  /** Detail / focus pane (rendered second; on phones this stacks below `left`). */
  readonly right: ReactNode;
  /**
   * Flex weight for the left pane on `gtMd`+. Defaults to `0.4`
   * (40 % of the row).
   */
  readonly leftFlex?: number;
  /**
   * Flex weight for the right pane on `gtMd`+. Defaults to `0.6`
   * (60 % of the row).
   */
  readonly rightFlex?: number;
  /**
   * Inter-pane gap on `gtMd`+ in px. Defaults to `16` (matches the
   * §8 24-pt rhythm minus the 8-pt internal pane padding).
   */
  readonly gap?: number;
  /** Forwarded to the root `<View>` for E2E anchoring. */
  readonly testID?: string;
}

const DEFAULT_LEFT_FLEX = 0.4;
const DEFAULT_RIGHT_FLEX = 0.6;
const DEFAULT_GAP = 16;

export function SplitPane(props: SplitPaneProps): ReactElement {
  const media = useMedia();
  const leftFlex = props.leftFlex ?? DEFAULT_LEFT_FLEX;
  const rightFlex = props.rightFlex ?? DEFAULT_RIGHT_FLEX;
  const gap = props.gap ?? DEFAULT_GAP;
  const sideBySide = Boolean(media.gtMd);

  if (!sideBySide) {
    // Phone + small-tablet-portrait fallback: stack the panes.
    // Right pane goes below left so list-then-detail reads top-to-bottom
    // on a phone, matching the bottom-tab navigation users already drill
    // into the list and back out for detail.
    return (
      <View testID={props.testID ?? 'split-pane'} flexDirection="column" flex={1} gap={gap}>
        <View testID="split-pane-left" flex={1}>
          {props.left}
        </View>
        <View testID="split-pane-right" flex={1}>
          {props.right}
        </View>
      </View>
    );
  }

  return (
    <View testID={props.testID ?? 'split-pane'} flexDirection="row" flex={1} gap={gap}>
      <View testID="split-pane-left" flex={leftFlex}>
        {props.left}
      </View>
      <View testID="split-pane-right" flex={rightFlex}>
        {props.right}
      </View>
    </View>
  );
}
