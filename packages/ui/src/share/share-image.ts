/**
 * `shareComprobanteAsImage` — bundles `rasterizeComprobante` +
 * `shareFile` into the audit-prescribed share path
 * (M-1 PR 3.5-T07 part 3/3).
 *
 * Consumers call this once and get either the OS-native share sheet
 * (mobile + macOS Monterey+ + modern Chromium) or a `<a download>`
 * fallback that hands the user the rasterized PNG / PDF as a save.
 *
 * Why this lives next to `shareFile` and `rasterizeComprobante` rather
 * than inside one of them:
 *   - `rasterizeComprobante` should be reusable headlessly (e.g.
 *     for a future "Export all comprobantes as ZIP" path that doesn't
 *     trigger a share sheet).
 *   - `shareFile` is generic over Excel, PDF exports, etc — coupling
 *     it to comprobante-specific concerns would muddy the contract.
 *   - The bundle is the public-facing one — most call-sites just want
 *     "user tapped Share, do the right thing".
 *
 * **Back-compat note.** The existing `shareComprobante({title, text,
 * html, filenameStem})` path remains the default for callers that
 * don't yet wire a `<PreviewFrame>` `frameRef`. New call-sites should
 * prefer `shareComprobanteAsImage` because:
 *   - WhatsApp, Instagram, Mail, AirDrop all handle PNGs natively.
 *   - The previous "HTML attachment" path falls back to a text share
 *     on RN (no preview, no thumbnail), which is brand-unfriendly.
 *
 * Tests cover the web path; the native path is verified via Maestro
 * (matches the Scanner.native pattern).
 */

import { rasterizeComprobante } from './rasterize';
import type { RasterizeFormat, RasterizeOptions } from './rasterize';
import { shareFile } from './share-file';
import type { ShareResult } from './share';

export interface ShareComprobanteAsImageOptions extends Pick<
  RasterizeOptions,
  'html' | 'frameRef' | 'filenameStem' | 'width'
> {
  /**
   * Surfaced by the OS share sheet ("Comprobante — Pan dulce $1,200").
   * Falls back to the filename when the share API doesn't honour the
   * field (Android intent picker is inconsistent here).
   */
  readonly title: string;
  /** Output format. Defaults to `'png'`. PDF is web-only. */
  readonly format?: RasterizeFormat;
}

export async function shareComprobanteAsImage(
  opts: ShareComprobanteAsImageOptions,
): Promise<ShareResult> {
  const rasterized = await rasterizeComprobante({
    html: opts.html,
    format: opts.format,
    frameRef: opts.frameRef,
    filenameStem: opts.filenameStem,
    width: opts.width,
  });
  return shareFile({
    title: opts.title,
    filename: rasterized.filename,
    blob: rasterized.blob,
  });
}
