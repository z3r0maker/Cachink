/**
 * Public share surface. Re-exports the shared types + the platform
 * implementation. Metro picks `./share.native.ts` and
 * `./rasterize.native.ts`; Vite picks `./share.web.ts` and
 * `./rasterize.web.ts` (via the re-export chain in `./share` and
 * `./rasterize`).
 */

export type { ShareResult, ShareTarget } from './share.shared';
export { shareComprobanteFallback } from './share.shared';
export { shareComprobante } from './share.web';
export { shareFile, type ShareFileTarget } from './share-file';
export { rasterizeComprobante, DEFAULT_FILENAME_STEM, DEFAULT_RASTERIZE_WIDTH } from './rasterize';
export type { RasterizeFormat, RasterizeOptions, RasterizedBlob } from './rasterize';
export { shareComprobanteAsImage } from './share-image';
export type { ShareComprobanteAsImageOptions } from './share-image';
