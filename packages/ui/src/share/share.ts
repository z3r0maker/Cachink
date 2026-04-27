/**
 * Share — cross-platform comprobante share API (P1C-M3-T04 part 2/2).
 *
 * Shared types + defaults. Platform implementations of `shareComprobante`
 * live in `./share.native.tsx` (React Native) and `./share.web.tsx`
 * (Tauri webview). Metro + Vite auto-pick the right variant.
 *
 * Shared types + `shareComprobanteFallback` live in `./share.shared.ts`
 * so the `share/index.ts` barrel can re-export them without Metro
 * shadowing this base file with `share.native.ts`. New code should
 * import from `./share.shared` (or the `share/index.ts` barrel)
 * directly; this file is a backwards-compatible re-export shim.
 *
 * Keeps the surface intentionally tiny — one function that accepts a
 * ShareTarget, returns a Promise<ShareResult>. Implementation details
 * (PNG rasterization, WhatsApp intents, temp-file writing) are the
 * platform variant's responsibility.
 */

export type { ShareResult, ShareTarget } from './share.shared';
export { shareComprobanteFallback } from './share.shared';
