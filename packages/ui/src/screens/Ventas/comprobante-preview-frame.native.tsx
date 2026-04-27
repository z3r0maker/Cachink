/**
 * `<PreviewFrame>` — React Native variant (audit M-1 PR 3.5-T07).
 *
 * Renders the comprobante HTML inside `react-native-webview`'s
 * `<WebView source={{ html }}>` so the on-device preview matches the
 * web/Tauri `<iframe>` 1:1. Replaces the previous "monospace text"
 * fallback that read as the literal HTML source rather than the
 * rendered receipt.
 *
 * **Ref forwarding for rasterization (Phase E2).** The optional
 * `frameRef` prop receives the wrapping `<View>` ref. The Phase E2
 * rasterize helper passes that ref into `react-native-view-shot`'s
 * `captureRef(...)` to produce the PNG / PDF that ships through the
 * native share sheet. The WebView itself is layered inside the
 * captured view so the screenshot includes the rendered receipt.
 *
 * **Why an explicit prop instead of `forwardRef`.** `forwardRef`
 * doesn't survive the platform-extension default-export chain
 * (`./comprobante-preview-frame.tsx → ./comprobante-preview-frame.web`).
 * A regular prop is the simplest pattern that keeps the shared
 * contract identical between the web (`iframe`) and native
 * (`WebView`) variants — the web variant accepts the same prop and
 * ignores it (rasterization there uses `html2canvas` against the
 * iframe's `contentDocument`, no ref required).
 *
 * **Sandbox semantics.** `originWhitelist={['*']}` tracks the iframe
 * variant's `sandbox="allow-same-origin"` — the WebView only
 * renders the static HTML the app generates from its own ledger;
 * `javaScriptEnabled={false}` matches the iframe's "no
 * `allow-scripts`" stance.
 */

import type { ReactElement, RefObject } from 'react';
import { View } from '@tamagui/core';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - react-native-webview is a peer dep resolved by Metro
// at runtime. The mobile app's package.json adds it; Vite tools
// (Vitest, Storybook, Tauri) never traverse this file.
import { WebView } from 'react-native-webview';
import { colors, radii } from '../../theme';

export type PreviewFrameRef = RefObject<unknown>;

export interface PreviewFrameProps {
  readonly html: string;
  /**
   * Forward this ref onto the WebView's wrapping `<View>` for
   * `react-native-view-shot`'s `captureRef(...)` to consume during
   * rasterization. Optional — Phase E2's rasterize helper supplies
   * the ref; consumers that only render the preview can omit it.
   */
  readonly frameRef?: PreviewFrameRef;
}

const FRAME_HEIGHT = 360;

export function PreviewFrame({ html, frameRef }: PreviewFrameProps): ReactElement {
  return (
    <View
      ref={frameRef as never}
      testID="comprobante-preview-frame"
      borderWidth={2}
      borderColor={colors.black}
      borderRadius={radii[2]}
      padding={0}
      backgroundColor={colors.white}
      height={FRAME_HEIGHT}
      style={{ overflow: 'hidden' }}
    >
      <WebView
        testID="comprobante-preview-webview"
        originWhitelist={['*']}
        javaScriptEnabled={false}
        scalesPageToFit
        source={{ html }}
        style={{ flex: 1, backgroundColor: colors.white }}
      />
    </View>
  );
}
