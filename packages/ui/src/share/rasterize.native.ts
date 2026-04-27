/**
 * `rasterizeComprobante` — React Native variant.
 *
 * Captures the rendered comprobante `<WebView>` (rendered by
 * `comprobante-preview-frame.native.tsx`) via
 * `react-native-view-shot`'s `captureRef(...)`. The caller passes a
 * `frameRef` mounted on the preview frame; the WebView's content
 * sits inside that ref's wrapping `<View>`, so the screenshot
 * includes the rendered receipt at native resolution.
 *
 * **PNG only.** `view-shot` produces PNG / JPG raster output; PDF
 * generation on RN requires a separate native module
 * (`react-native-html-to-pdf` or similar) which is out of scope for
 * this slice. Calling with `format: 'pdf'` falls back to PNG and
 * logs a warning so callers see the silent downgrade.
 *
 * **dynamic-import** matches the web variant: `view-shot` is loaded
 * lazily so cold-start doesn't pay for it. The native module is
 * autolinked at build time (per ADR-041's icon-module pattern); the
 * import here only pulls the JS shim.
 *
 * Metro auto-picks this file over `./rasterize.ts` and
 * `./rasterize.web.ts` on mobile.
 */

import type { RasterizeOptions, RasterizedBlob } from './rasterize.shared';
import { DEFAULT_FILENAME_STEM } from './rasterize.shared';

type CaptureResult = 'tmpfile' | 'data-uri' | 'base64';

interface CaptureOptions {
  readonly format: 'png' | 'jpg';
  readonly result: CaptureResult;
  readonly quality?: number;
}

interface ViewShotModule {
  captureRef: (target: unknown, options: CaptureOptions) => Promise<string>;
}

async function loadViewShot(): Promise<ViewShotModule> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - react-native-view-shot is a peer dep resolved by Metro at runtime.
  const mod = (await import('react-native-view-shot')) as ViewShotModule;
  return mod;
}

/**
 * Convert a `data:image/png;base64,...` URI into a `Blob`. RN doesn't
 * ship `URL.createObjectURL`-backed Blob construction natively, but
 * `fetch(dataUri).blob()` is broadly available on RN's URL polyfill
 * stack (and on react-native-web for tests).
 */
async function dataUriToBlob(dataUri: string): Promise<Blob> {
  const response = await fetch(dataUri);
  return response.blob();
}

export async function rasterizeComprobante(opts: RasterizeOptions): Promise<RasterizedBlob> {
  if (!opts.frameRef?.current) {
    throw new Error(
      'rasterizeComprobante.native requires a frameRef pointing at the rendered <PreviewFrame>',
    );
  }
  if (opts.format === 'pdf') {
    console.warn(
      '[rasterizeComprobante.native] PDF format is not supported on RN; downgrading to PNG.',
    );
  }
  const stem = opts.filenameStem ?? DEFAULT_FILENAME_STEM;
  const { captureRef } = await loadViewShot();
  const dataUri = await captureRef(opts.frameRef.current, {
    format: 'png',
    result: 'data-uri',
    quality: 1,
  });
  const blob = await dataUriToBlob(dataUri);
  return {
    blob,
    contentType: 'image/png',
    extension: 'png',
    filename: `${stem}.png`,
  };
}
