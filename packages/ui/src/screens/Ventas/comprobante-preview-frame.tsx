/**
 * `<PreviewFrame>` — shared types + web variant for the comprobante
 * HTML preview.
 *
 * Audit 2.16 fixed: the original implementation rendered the raw HTML
 * string inside a `<Text>` block in monospace, which read as the
 * literal source code instead of the receipt-shaped preview the user
 * was about to share. The web variant now uses a sandboxed `<iframe>`
 * with `srcDoc={html}` so the preview matches the rendered output 1:1.
 * Tauri's WebView and Vite + Storybook all honour `srcDoc`, so this
 * works on the desktop app and in stories.
 *
 * The native variant lives in `./comprobante-preview-frame.native.tsx`
 * (Phase E1 — `<WebView source={{ html }}>` from `react-native-webview`).
 *
 * **Ref forwarding for rasterization (Phase E2).** The optional
 * `frameRef` prop is part of the shared contract. On native the
 * rasterize helper forwards it into `react-native-view-shot`'s
 * `captureRef(...)`. On web the preview is rasterized via
 * `html2canvas` against the iframe's `contentDocument`, so the web
 * variant accepts the prop and ignores it — the contract stays
 * identical between platforms.
 */
import type { ReactElement, RefObject } from 'react';
import { View } from '@tamagui/core';
import { colors, radii } from '../../theme';

/**
 * `react-native-view-shot`'s `captureRef(ref)` accepts a React element
 * ref or component instance. The exact instance type differs between
 * Tamagui and RN core, and the web variant doesn't use the ref at all
 * — `unknown` keeps the contract platform-agnostic.
 */
export type PreviewFrameRef = RefObject<unknown>;

export interface PreviewFrameProps {
  readonly html: string;
  /**
   * Native variant only — see `./comprobante-preview-frame.native.tsx`.
   * Web variant accepts the prop for surface symmetry; rasterization
   * on web reads from the iframe's DOM directly via `html2canvas`.
   */
  readonly frameRef?: PreviewFrameRef;
}

const FRAME_HEIGHT = 360;

export function PreviewFrame({ html }: PreviewFrameProps): ReactElement {
  return (
    <View
      testID="comprobante-preview-frame"
      borderWidth={2}
      borderColor={colors.black}
      borderRadius={radii[2]}
      padding={0}
      backgroundColor={colors.white}
      style={{ overflow: 'hidden' }}
    >
      {/*
       * `srcDoc` injects the HTML inline so we don't need a navigation
       * round-trip. `sandbox="allow-same-origin"` keeps the iframe in a
       * write-isolated origin (no parent-cookie access, no top-frame
       * navigation), which is the right level for HTML the app
       * generates from its own ledger. We deliberately do NOT include
       * `allow-scripts` — comprobantes are static markup, no JS allowed.
       */}
      <iframe
        title="Comprobante"
        srcDoc={html}
        sandbox="allow-same-origin"
        data-testid="comprobante-preview-iframe"
        style={{
          width: '100%',
          height: FRAME_HEIGHT,
          border: 'none',
          display: 'block',
          backgroundColor: colors.white,
        }}
      />
    </View>
  );
}
