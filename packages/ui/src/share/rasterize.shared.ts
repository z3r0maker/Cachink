/**
 * Rasterize — shared types + constants (no platform extension).
 *
 * Lives separately from `./rasterize.ts` so the platform variants
 * (`rasterize.native.ts`, `rasterize.web.ts`) can pull the contract
 * without Metro/Vite resolving back to the platform-extension entry.
 * Importing `./rasterize` from `rasterize.native.ts` would self-cycle on
 * RN because Metro picks `rasterize.native.ts` first when resolving
 * `./rasterize`.
 */

import type { PreviewFrameRef } from '../screens/Ventas/comprobante-preview-frame';

export type RasterizeFormat = 'png' | 'pdf';

export interface RasterizeOptions {
  /** The receipt HTML produced by `useComprobanteHtml(...)`. */
  readonly html: string;
  /** Output format. Defaults to `'png'`. PDF is web-only. */
  readonly format?: RasterizeFormat;
  /**
   * Required on native — the rasterizer captures the rendered
   * `<WebView>` rather than re-rendering the HTML to an offscreen DOM.
   * Web variant ignores this prop (rasterizes the HTML directly via
   * `html2canvas` against a hidden container).
   */
  readonly frameRef?: PreviewFrameRef;
  /**
   * Optional output width in pixels. Defaults to 480 (matches the
   * preview frame's max-width) on web; ignored on native (uses the
   * WebView's natural size).
   */
  readonly width?: number;
  /** Optional filename stem (without extension). Defaults to `comprobante`. */
  readonly filenameStem?: string;
}

export interface RasterizedBlob {
  readonly blob: Blob;
  readonly contentType: 'image/png' | 'application/pdf';
  readonly extension: 'png' | 'pdf';
  readonly filename: string;
}

/** Default render width for web rasterization (matches the preview frame). */
export const DEFAULT_RASTERIZE_WIDTH = 480;

/** Default filename stem for the produced blob. */
export const DEFAULT_FILENAME_STEM = 'comprobante';
