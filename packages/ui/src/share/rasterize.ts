/**
 * `rasterizeComprobante` — shared contract for the comprobante
 * rasterization helper (audit M-1 PR 3.5-T07).
 *
 * Phase E2 of the comprobante share path. Turns the receipt HTML into
 * a binary blob (PNG default, PDF opt-in on web) that the share helper
 * (`./share-file`) attaches to native share sheets.
 *
 * Two platform variants:
 *   - `./rasterize.web.ts` — renders the HTML into a hidden container
 *     then captures it with `html2canvas`. PDF wraps the canvas in a
 *     `jspdf` document. Both libs are dynamic-imported so they don't
 *     land in the cold-start bundle.
 *   - `./rasterize.native.ts` — captures the rendered `<WebView>` from
 *     `comprobante-preview-frame.native.tsx` via
 *     `react-native-view-shot`'s `captureRef(...)`. The caller passes
 *     a `frameRef` mounted on the preview frame. PNG only — view-shot
 *     doesn't produce PDF.
 *
 * Per CLAUDE.md §5.3 the default export delegates to the web variant
 * so Vite-based tools (Vitest, Storybook, Tauri) resolve correctly
 * without extra config. Metro picks `./rasterize.native.ts` on mobile.
 *
 * Shared types + constants live in `./rasterize.shared.ts` so the
 * platform variants don't self-cycle through this entry file.
 */

export type { RasterizeFormat, RasterizeOptions, RasterizedBlob } from './rasterize.shared';
export { DEFAULT_RASTERIZE_WIDTH, DEFAULT_FILENAME_STEM } from './rasterize.shared';

// Default export for Vite/Tauri/Vitest. Metro picks `./rasterize.native.ts`.
export { rasterizeComprobante } from './rasterize.web';
