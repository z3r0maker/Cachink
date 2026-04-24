/**
 * Public share surface. Re-exports the shared types + the platform
 * implementation. Metro picks `./share.native.ts`; Vite picks
 * `./share.web.ts` (via the re-export chain).
 */

export type { ShareResult, ShareTarget } from './share';
export { shareComprobanteFallback } from './share';
export { shareComprobante } from './share.web';
